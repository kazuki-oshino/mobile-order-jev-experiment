import { assistanceOptions, initialAssistance, effectiveAction } from '../src/assistance';
import { describe, expect, it } from 'vitest';
import { AttentionTracker, preferenceSummary, ruleEvidence } from '../src/attention';
import { buildRequest, parseEvaluation } from '../src/jev';
import { attributeLabels, donuts, findDonut, moodKeys, moodRules, type Attribute } from '../src/catalog';

const snapshot = () => new AttentionTracker().snapshot(1000,'all','',[]);
export const validResponse = () => ({ model: 'jev-test', answers: Object.fromEntries([
  ['assist_action', { type: 'choice', choice: 'recommend', probabilities: { watch: .1, recommend: .8, ask: .1 }, confidence: .7 }],
  ['assist_topic', { type: 'choice', choice: 'texture', probabilities: { texture: .8, sweetness: .1, portion: .1 }, confidence: .7 }],
  ...moodKeys.map(key => [`mood_${key}`, { type: 'noul', noul: key==='sweet' ? .9 : .2 }]),
  ...donuts.map(d=>[`fit_${d.id}`,{type:'score',score:d.id==='custard'?2.9:1}]),
]), usage:{input_tokens:100,output_tokens:50} });

describe('閲覧記録',()=>{
  it('同じカード内の重複イベントを再訪に数えず、戻ってきたときだけ数える',()=>{
    const t=new AttentionTracker(); t.enter('honey',1000);t.enter('honey',1200,'keyboard');
    t.leave(3000);t.enter('berry',4000);t.enter('honey',5000);
    const s=t.snapshot(6000,'all','',[]);
    expect(s.totalVisits).toBe(3);expect(s.uniqueViewed).toBe(2);
    expect(s.observations.find(o=>o.id==='honey')?.visits).toBe(2);
    expect(s.observations.find(o=>o.id==='honey')?.dwellMs).toBe(3000);
  });
  it('古いカードのleaveで、次のカードへの注目を終了しない',()=>{
    const t=new AttentionTracker();t.enter('honey',1000);t.enter('berry',2000);t.leave(2200,'honey');
    expect(t.snapshot(2500,'all','',[]).activeId).toBe('berry');
  });
  it('最近の低カロリー商品の関心が、以前の甘い商品の履歴を上回る',()=>{
    const t=new AttentionTracker();t.enter('custard',1000);t.leave(6000);t.enter('plain',22000);
    const s=t.snapshot(26000,'all','',[]);
    expect(s.observations[0].id).toBe('plain');expect(preferenceSummary(s)!.kcal).toBeLessThan(200);
  });
  it('カーソル放置を8秒で頭打ちにし、30秒後には最近の関心から外す',()=>{
    const t=new AttentionTracker();t.enter('honey',1000);
    expect(t.snapshot(12000,'all','',[]).activeId).toBeNull();
    expect(t.snapshot(12000,'all','',[]).observations[0].recentMs).toBe(8000);
    expect(t.snapshot(41000,'all','',[]).observations[0].attention).toBe(0);
  });
  it('リセットで記録と進行中の滞在を消す',()=>{
    const t=new AttentionTracker();t.enter('cacao',1000);t.clear();
    const s=t.snapshot(2000,'all','',[]);
    expect(s.observations).toEqual([]);expect(s.totalVisits).toBe(0);expect(s.activeId).toBeNull();
  });
});

describe('Jev連携',()=>{
  it('18仮説・20商品・接客行動と質問の判断を1回にまとめ、属性のカロリーと甘さを別々に渡す',()=>{
    const request=buildRequest(snapshot());
    expect(Object.keys(request.questions)).toHaveLength(40);
    expect(Object.keys(request.state.catalog)).toHaveLength(20);
    expect(request.state.catalog.cacao.kcal).toBe(328);
    expect(request.state.catalog.cacao.sweetness).toBe(2);
    expect(request.state.catalog.custard.creaminess).toBe(5);
    expect(request.state.catalog.oat.method).toBe('baked');
    expect(request.state.catalog.plain.portionGrams).toBe(40);
    expect(Object.keys(request.state.ruleEvidence)).toHaveLength(18);
    expect(request.questions.mood_light.instructions).toContain('Low sweetness alone is NOT');
  });
  it('Jevの20スコアで順位を作り、Noulの確率は独立して保持する',()=>{
    const result=parseEvaluation(validResponse(),snapshot(),500);
    expect(result.ranking).toHaveLength(20);expect(result.ranking[0].id).toBe('custard');
    expect(result.moods.sweet).toBe(.9);expect(result.tokens).toBe(150);
  });
  it('欠損・非数値・範囲外の応答を見せない',()=>{
    for (const bad of [NaN,Infinity,-1,4]) {
      const raw=validResponse();raw.answers.fit_honey={type:'score',score:bad};
      expect(()=>parseEvaluation(raw,snapshot(),0)).toThrow();
    }
    const raw=validResponse();delete raw.answers.mood_light;
    expect(()=>parseEvaluation(raw,snapshot(),0)).toThrow();
    expect(()=>parseEvaluation({},snapshot(),0)).toThrow();
  });
});

describe('商品の数値条件',()=>{
  it('20商品すべてに有効な追加属性があり、18条件それぞれに対象商品がある',()=>{
    for(const d of donuts){
      for(const key of Object.keys(attributeLabels) as Attribute[]){expect(d[key]).toBeGreaterThanOrEqual(1);expect(d[key]).toBeLessThanOrEqual(5);}
      expect(d.portionGrams).toBeGreaterThan(0);expect(['baked','fried']).toContain(d.method);
    }
    for(const key of moodKeys) expect(donuts.some(moodRules[key].matches)).toBe(true);
  });
  it('苦味とカロリー、果実感と酸味、もちもちとさっくりを混同しない',()=>{
    const cacao=findDonut('cacao'),mango=findDonut('mango'),honey=findDonut('honey');
    expect(moodRules.bitter.matches(cacao)).toBe(true);expect(moodRules.light.matches(cacao)).toBe(false);
    expect(moodRules.fruity.matches(mango)).toBe(true);expect(moodRules.tangy.matches(mango)).toBe(false);
    expect(moodRules.chewy.matches(honey)).toBe(true);expect(moodRules.crispy.matches(honey)).toBe(false);
    expect(moodRules.hearty.matches(findDonut('custard'))).toBe(true);
    expect(moodRules.tidy.matches(findDonut('custard'))).toBe(false);
  });
  it('ルールの一致商品と注目割合を集計し、閲覧前に関心を作らない',()=>{
    expect(ruleEvidence(snapshot()).creamy.attentionShare).toBe(0);
    const t=new AttentionTracker();t.enter('custard',1000);
    const s=t.snapshot(3000,'all','',[]),rules=ruleEvidence(s);
    expect(rules.creamy.candidateIds).toEqual(['custard','chococream']);
    expect(rules.creamy.viewedMatches).toEqual(['custard']);expect(rules.creamy.attentionShare).toBe(1);
    expect(rules.light.attentionShare).toBe(0);expect(preferenceSummary(s)!.portionGrams).toBe(100);
  });
});


describe('接客の選択と実行境界', () => {
  it('比較は直近の異なる2品から作り、フィルター外とバッグ内を除く', () => {
    const s = { ...snapshot(), recentSequence: ['custard','honey','custard'] as const };
    const input = { ...s, recentSequence: [...s.recentSequence] };
    expect(assistanceOptions(input).pair).toEqual(['honey','custard']);
    expect(assistanceOptions(input).actions.compare).toBeDefined();
    expect(assistanceOptions({ ...input, basket: ['custard'] }).actions.compare).toBeUndefined();
    expect(assistanceOptions({ ...input, filter: 'light' }).actions.compare).toBeUndefined();
    expect(assistanceOptions(snapshot()).actions.compare).toBeUndefined();
  });
  it('見守り指定、辞退済み行動、回答済み質問を候補から除く', () => {
    expect(Object.keys(assistanceOptions({ ...snapshot(), assistance: { ...initialAssistance, quiet: true } }).actions)).toEqual(['watch']);
    const s = { ...snapshot(), assistance: { ...initialAssistance, answers: { texture: 'もちもち' }, dismissed: ['recommend'] as const } };
    const options = assistanceOptions({ ...s, assistance: { ...s.assistance, dismissed: [...s.assistance.dismissed] } });
    expect(options.topics).toEqual(['sweetness','portion']);
    expect(options.actions.recommend).toBeUndefined();
    const request = buildRequest({ ...snapshot(), assistance: { ...initialAssistance, answers: { texture: 'もちもち', sweetness: '甘さ控えめ', portion: '小さめをひとつ' } } });
    expect(request.questions.assist_topic).toBeUndefined();
    expect(request.state.shopperAnswers.texture).toBe('もちもち');
  });
  it('候補外・欠損・不正な分布やconfidenceを拒否する', () => {
    for (const change of [
      { choice: 'compare' }, { choice: 'unknown' }, { probabilities: { watch: .1, recommend: .8 } },
      { probabilities: { watch: .1, recommend: NaN, ask: .1 } },
      { probabilities: { watch: .9, recommend: .8, ask: .1 } },
      { confidence: Infinity }, { choice: 'watch' },
    ]) {
      const raw = validResponse();
      raw.answers.assist_action = { ...raw.answers.assist_action, ...change };
      expect(() => parseEvaluation(raw, snapshot(), 0)).toThrow('接客判断');
    }
    const raw = validResponse(); delete raw.answers.assist_topic;
    expect(() => parseEvaluation(raw,snapshot(),0)).toThrow('接客判断');
  });
  it('返答のない時は見守り、固定モードでも見守り指定を優先する', () => {
    const decision = parseEvaluation(validResponse(), snapshot(), 10).assistance;
    expect(effectiveAction(undefined, initialAssistance, assistanceOptions(snapshot()).actions)).toBe('watch');
    expect(effectiveAction(decision, { ...initialAssistance, mode: 'fixed', quiet: true }, { watch: 'watch' })).toBe('watch');
    expect(effectiveAction(decision, initialAssistance, { watch: 'watch' })).toBe('watch');
  });
});
