// 起動中のローカルプロキシで合成シナリオを確認する。キーは扱わない。
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
const bundled = await build({ stdin: { contents: "export * from './src/jev'; export * from './src/attention'; export * from './src/assistance';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { buildRequest, parseEvaluation, AttentionTracker, initialAssistance } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const empty = () => new AttentionTracker().snapshot(10000, 'all', '', []);
const tracker = new AttentionTracker();
tracker.enter('honey',1000); tracker.enter('berry',3000); tracker.enter('honey',5000); tracker.enter('berry',7000); tracker.leave(9000);
const fixtures = [
  ['sparse', empty(), 'watch'],
  ['ask', { ...empty(), note: '好みを決めるために、食感について一つ質問してほしい' }, 'ask'],
  ['compare', { ...tracker.snapshot(10000,'all','ハニー・ハグとベリー・キスの違いを比べたい',[]) }, 'compare'],
  ['recommend', { ...empty(), note: '甘さ控えめで、もちもちのドーナツをおすすめして' }, 'recommend'],
  ['quiet', { ...empty(), assistance: { ...initialAssistance, quiet: true } }, 'watch'],
  ['answered', { ...empty(), note: '好みを決めるために、食感について一つ質問してほしい', assistance: { ...initialAssistance, answers: { texture: 'もちもち' } } }, 'recommend'],
];
const results = [];
for (const [name, snapshot, expected] of fixtures) {
  const started = performance.now();
  const request = buildRequest(snapshot);
  const response = await fetch('http://127.0.0.1:5173/jev/v1/systemone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const result = parseEvaluation(await response.json(), snapshot, Math.round(performance.now() - started));
  const row = { name, expected, actual: result.assistance.action, matched: result.assistance.action === expected, topic: result.assistance.topic, probabilities: result.assistance.probabilities, latency: result.latency, model: result.model, tokens: result.tokens, questions: Object.keys(request.questions).length };
  results.push(row); console.log(JSON.stringify(row));
}
await writeFile('docs/assistance-api-check.json', JSON.stringify({ checkedAt: new Date().toISOString(), scope: '合成6例・各1回の実API確認。一般精度・UX効果は測定していない。', results }, null, 2) + '\n');
if (results.some(row => !row.matched)) process.exitCode = 1;
