import { GuideAction } from './GuideAction';
import { actionLabels, assistanceOptions, effectiveAction, initialAssistance, type AssistanceContext, type AssistAction, type AssistEvent, type QuestionTopic } from './assistance';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronRight, CircleHelp, Eye, Heart, Minus, Pause, Play, Plus, RotateCcw, ShoppingBag, Sparkles, X, Zap } from 'lucide-react';
import { attributeLabels, donuts, filters, findDonut, moodKeys, moods, type Attribute, type DonutId, type Filter, type Mood } from './catalog';
import { ruleEvidence } from './attention';
import { useJev } from './useJev';

const money = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
function DonutImage({ id, className = '' }: { id: DonutId; className?: string }) {
  const index = findDonut(id).index;
  return <span className={`donut-image ${className}`} role="img" aria-label={findDonut(id).name} style={{ backgroundPosition: `${(index % 5) * 25}% ${Math.floor(index / 5) * 100 / 3}%` }}/>;
}
function Face({ expression, className = '' }: { expression: number; className?: string }) {
  return <span className={`jev-face ${className}`} role="img" aria-label={['にこやかなJev','ウインクするJev','やさしく微笑むJev','考え中のJev','うれしそうなJev'][expression]} style={{ backgroundPosition: `${expression * 25}% 50%` }}/>;
}

export default function App() {
  const [assistance, setAssistance] = useState<AssistanceContext>(initialAssistance);
  const [assistEvents, setAssistEvents] = useState<AssistEvent[]>([]);
  const eventId = useRef(0);
  const [comparison, setComparison] = useState<DonutId[] | null>(null);
  const comparisonRef = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [note, setNote] = useState('');
  const [basket, setBasket] = useState<DonutId[]>([]);
  const [detail, setDetail] = useState<DonutId | null>(null);
  const [showBasket, setShowBasket] = useState(false);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');
  const [inspector, setInspector] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const detailRef = useRef<HTMLDialogElement>(null);
  const basketRef = useRef<HTMLDialogElement>(null);
  const guideRef = useRef<HTMLDialogElement>(null);
  const live = useJev(note, filter, basket, assistance);
  const available = assistanceOptions({ ...live.snapshot, filter, basket, assistance });
  const action = effectiveAction(live.result?.assistance, assistance, available.actions);
  const showRecommendations = action === 'recommend';
  const adaptive = assistance.mode === 'adaptive';
  const evidence = ruleEvidence(live.result?.observed ?? live.snapshot);
  const sortedMoods = live.result ? [...moodKeys].sort((a,b) => live.result!.moods[b] - live.result!.moods[a]) : [];
  const topMood: Mood | null = sortedMoods[0] && live.result!.moods[sortedMoods[0]] >= .55 ? sortedMoods[0] : null;
  const combined = !!live.result && live.result.moods.sweet > .6 && live.result.moods.light > .6;
  const reaction = topMood ? moods[topMood] : null;
  const face = combined ? 3 : reaction?.face ?? (live.busy && !live.result ? 3 : 0);
  const legacyLine = combined ? '甘いものは食べたい。でも、軽さも気になる？' : reaction?.line ?? (live.snapshot.uniqueViewed ? 'どんな気分かな。一緒に探してみましょう。' : 'いらっしゃい。今日は、どの子が気になる？');
  const legacyDescription = combined ? 'その間をとって、甘さも楽しめる軽めの一品はいかが？' : reaction?.detail ?? '気になるドーナツを、ゆっくり眺めてみて。あなたへのおすすめを考えます。';
  const line = adaptive || assistance.quiet ? ({ compare: 'ふたつの違い、並べてみようか。', ask: '選ぶヒントを、ひとつだけ。', recommend: 'いまの気分に、こんなドーナツ。', watch: 'どうぞ、あなたのペースで。' })[action] : legacyLine;
  const recommendations = showRecommendations ? live.result?.ranking.filter(r => available.eligible.includes(r.id)).slice(0,3) ?? [] : [];
  const shown = donuts.filter(filters.find(f => f.id === filter)!.includes);
  const total = basket.reduce((sum,id)=>sum+findDonut(id).price,0);
  const status = !live.enabled ? '接客を一時停止中' : live.error ? '接続を確認してください' : live.idle ? live.updates ? '変化待ち · 入力が変わると更新' : 'あなたの「気になる」を待っています' : live.busy ? 'いまの気分を考えています' : 'あなたに合わせて接客中';
  useEffect(()=>{ if(comparison) comparisonRef.current?.showModal(); else comparisonRef.current?.close(); },[comparison]);
  useEffect(()=>{ if(detail) detailRef.current?.showModal(); else detailRef.current?.close(); },[detail]);
  useEffect(()=>{ if(mobileOpen) guideRef.current?.showModal(); else guideRef.current?.close(); },[mobileOpen]);
  useEffect(()=>{ if(showBasket) basketRef.current?.showModal(); else basketRef.current?.close(); },[showBasket]);
  useEffect(()=>{ if(!toast) return; const timer=setTimeout(()=>setToast(''),2200); return ()=>clearTimeout(timer); },[toast]);
  function record(action: AssistAction, outcome: string) {
    const event = { id: ++eventId.current, time: new Date().toLocaleTimeString('ja-JP', { hour12: false }), mode: assistance.mode, action, outcome };
    setAssistEvents(rows => [event, ...rows].slice(0, 40));
  }
  function answerQuestion(topic: QuestionTopic, answer: string) {
    record('ask', `回答：${answer}`);
    setAssistance(current => ({ ...current, answers: { ...current.answers, [topic]: answer } }));
    setToast(`「${answer}」を希望に加えました`);
  }
  function dismissAssistance() {
    record(action, '今は不要');
    setAssistance(current => ({ ...current, dismissed: [...new Set([...current.dismissed, action])] }));
  }
  function toggleQuiet() {
    record('watch', assistance.quiet ? 'お手伝いを再開' : '静かに見たい');
    setAssistance(current => ({ ...current, quiet: !current.quiet, dismissed: current.quiet ? [] : current.dismissed }));
  }
  function add(id: DonutId) { setBasket(items=>[...items,id]); live.touchActivity(); setToast(`${findDonut(id).name}をバッグに入れました`); }
  function reset() { setAssistance(current => ({ ...initialAssistance, mode: current.mode })); setAssistEvents([]); setComparison(null); setNote(''); setFilter('all'); live.reset(); setToast('「気になる」の記録をリセットしました'); }
  const wishForm = (id: string) => <div className="your-words"><label htmlFor={id}><span>ひと言、ジェヴに伝えるなら。</span><small>OPTIONAL</small></label><div><input id={id} value={note} maxLength={160} onChange={e=>{setNote(e.target.value);live.touchActivity();}} placeholder="例：もちもちで、こぼれにくいもの"/><ArrowRight size={16}/></div><p>言葉で伝えた希望を、閲覧の推測より優先します。</p>{Object.keys(assistance.answers).length > 0 && <div className="answer-chips" aria-label="質問に答えた希望">{(Object.keys(assistance.answers) as QuestionTopic[]).map(topic => <button key={topic} aria-label={`${assistance.answers[topic]}の回答を取り消す`} onClick={() => setAssistance(current => { const answers = { ...current.answers }; delete answers[topic]; return { ...current, answers }; })}>{assistance.answers[topic]} <X size={12}/></button>)}</div>}</div>;
  const assistant = <>
    <span className="sr-only" role="status">{line}</span><div className="assistant-top"><div><span className="live-dot"/><span>YOUR PERSONAL DONUT GUIDE</span></div><span className="live-pill">JEV LIVE</span></div>
    <div className="character-scene"><span className="scene-orbit"/><span className="scene-spark one">✳</span><span className="scene-spark two">✦</span><Face expression={face}/><div className="name-tag"><span>あなたのドーナツ係</span><strong>Jev <span>ジェヴ</span></strong></div><span className="expression-tag">{combined ? 'どっちも、いいよね' : topMood ? moods[topMood].label : 'ようこそ、LOOPへ'}</span></div>
    {adaptive || assistance.quiet ? <GuideAction action={action} decision={live.result?.assistance} quiet={assistance.quiet} ready={!!live.result} onCompare={pair => { live.leave(); record('compare', '比較を開いた'); setComparison([...pair]); }} onAnswer={answerQuestion} onDismiss={dismissAssistance} onQuiet={toggleQuiet}/> : <div className="speech"><span className="quote-mark">“</span><h2>{legacyLine}</h2><p>{legacyDescription}</p><div className="guide-controls"><button onClick={toggleQuiet}>今は、静かに見たい</button></div></div>}
    {showRecommendations && <>
    <div className="recommend-title"><div><Sparkles size={15}/><h3>いま、あなたにおすすめ</h3></div><span>{live.updates ? `UPDATE ${String(live.updates).padStart(2,'0')}` : 'まだ、白紙です'}</span></div>
    <div className="recommendations">{recommendations.length ? recommendations.map((r,i)=>{const d=findDonut(r.id);return <div className="recommendation" key={d.id}><span className="rank">0{i+1}</span><button className="recommend-product" onClick={()=>{record('recommend','商品を開いた');setDetail(d.id);}} aria-label={`おすすめの${d.name}を見る`}><DonutImage id={d.id}/><span><strong>{d.name}</strong><small>{d.kcal} kcal <b>·</b> 甘さ {'●'.repeat(d.sweetness)}{'○'.repeat(5-d.sweetness)}</small><em>{money(d.price)}</em></span></button><button className="round-button" aria-label={`${d.name}をおすすめからバッグに入れる`} onClick={()=>{record('recommend','バッグに入れた');add(d.id);}}><Plus size={15}/></button></div>}) : <div className="recommend-empty"><span>01 ──　02 ──　03 ──</span><p>気になる商品に、カーソルを。<br/>眺めるほど、おすすめが見えてきます。</p></div>}</div>
    </>}
    {showRecommendations && topMood && <div className="mood-signals"><span>いまの気分、こんな感じ？</span><div>{sortedMoods.filter(key=>live.result!.moods[key]>=.5).slice(0,3).map(key=><span key={key}><i/>{moods[key].label}</span>)}</div><small>閲覧からの推測です。違っていても大丈夫。</small></div>}
    {live.result && action !== 'watch' && <button className="guide-feedback" onClick={() => { record(action, '役に立った'); setToast('感想を記録しました。ありがとう！'); }}>このお手伝い、役に立った</button>}
    <div className="assistant-footer"><span className={live.busy ? 'status-dot working' : 'status-dot'}/><span>{status}</span>{live.result && <small>{live.result.latency} ms</small>}</div>
    {live.error && <div className="api-error" role="alert"><p>{live.error}</p><button onClick={live.retry}>接客を再開する <RotateCcw size={12}/></button></div>}
  </>;

  return <div className="app-shell">
    <header><a href="#" className="brand" aria-label="LOOP ホーム">loop<span>®</span></a><span className="brand-caption">GOOD DONUTS.<br/>A LITTLE MORE YOU.</span><nav><a href="#showcase" className="nav-active">ショーケース</a><button onClick={()=>setHelp(!help)} aria-expanded={help}>このお店の楽しみ方 <CircleHelp size={14}/></button></nav><button className="bag-button" aria-label={`バッグを開く（${basket.length}個）`} onClick={()=>{live.leave();setShowBasket(true);}}><ShoppingBag size={17}/><span>MY BAG</span><b>{basket.length}</b></button></header>
    <main>
      <section className="intro"><div><div className="eyebrow"><span/> THE DONUT COUNTER, REIMAGINED.</div><h1>「気になる」が、<br className="mobile-only"/><span>出会い</span>になる。</h1><p>選ぶ前の、ちょっとしたまなざしから。<br className="mobile-only"/> ジェヴが、いまのあなたに合う選び方をお手伝い。</p></div><div className="intro-stamp"><span>LOOK AROUND</span><Eye size={24}/><strong>気ままに、どうぞ。</strong><small>NO NEED TO KNOW WHAT YOU WANT.</small></div></section>
      {help && <div className="help-panel"><strong>お店を眺めるだけで、接客が変わります。</strong><p>① カードにカーソルを置く（スマホはタップ）。② 濃厚なもの、軽めのものなど、いくつか見比べる。③ 閲覧や希望が変わると、約1秒の間隔でジェヴが「比較する・一問聞く・提案する・見守る」からお手伝いを選びます。同じカードに置いたままなら更新を待ちます。気分が変わったら、違う種類を眺めてみて。</p><small>このPOCはカーソル／タップを記録します。カメラや本当の視線は使いません。記録はこのページ内だけで保持します。</small></div>}
      <section className="experience-controls" aria-label="接客の検証モード"><div><span className="eyebrow">A LITTLE HELP, AT THE RIGHT MOMENT</span><strong>おすすめの先に、選びやすさを。</strong><p>{adaptive ? '見比べる、一問聞く、ときには見守る。接客の仕方も変わります。' : 'いつものように、おすすめ商品を表示するモードです。'}</p></div><div className="mode-switch" role="group" aria-label="接客モード">{(['adaptive','fixed'] as const).map(mode => <button key={mode} aria-pressed={assistance.mode === mode} onClick={() => { live.leave(); setAssistance(current => ({ ...current, mode, dismissed: [] })); }}>{mode === 'adaptive' ? '接客を選ぶ' : 'おすすめを表示'}</button>)}</div></section>
      <div className="shop-layout">
        <section className="showcase" id="showcase">
          <div className="showcase-header"><div><span className="eyebrow">FRESH FROM OUR IMAGINATION</span><h2>今日のショーケース <span>20 donuts</span></h2></div><span className="browse-hint"><Eye size={14}/> 気になる子に、そっとカーソルを。</span></div>
          <div className="filters" role="group" aria-label="商品フィルター">{filters.map(f=><button key={f.id} className={filter===f.id?'active':''} aria-pressed={filter===f.id} onClick={()=>{live.leave();setFilter(f.id);live.touchActivity();}}>{f.label}{f.id==='all'&&<span>20</span>}</button>)}</div>
          <div className="observation-strip"><div><span className={live.snapshot.activeId?'radar active':'radar'}/><span>{live.snapshot.activeId ? <><strong>{findDonut(live.snapshot.activeId).name}</strong> が気になる？</> : 'ゆっくり見比べて、あなたのペースで。'}</span></div><small><Eye size={12}/>{live.snapshot.uniqueViewed} 品に注目 <span>·</span> {live.snapshot.totalVisits} 回</small></div>
          <div className="product-grid">{shown.map(d=>{
            const obs=live.snapshot.observations.find(o=>o.id===d.id);
            const watching=live.snapshot.activeId===d.id;
            const recommended=recommendations.some(r=>r.id===d.id);
            return <article className={`product-card ${watching?'watching':''}`} key={d.id} onPointerEnter={e=>{if(e.pointerType==='mouse')live.enter(d.id,'pointer');}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&detail!==d.id)live.leave(d.id);}} onFocus={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))live.enter(d.id,'keyboard');}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&detail!==d.id)live.leave(d.id);}}>
              <button className="product-main" aria-label={`${d.name}を見てみる`} onClick={()=>{live.enter(d.id,'touch');setDetail(d.id);}}><div className="product-photo"><span className="product-number">{String(d.index+1).padStart(2,'0')}</span>{d.kcal<200?<span className="light-badge">LIGHT</span>:recommended?<span className="for-you-badge"><Sparkles size={9}/> FOR YOU</span>:null}<DonutImage id={d.id}/>{watching&&<span className="watching-tag"><Eye size={10}/> 気になる、をキャッチ</span>}</div><div className="product-info"><span className="product-en">{d.en}</span><h3>{d.name}</h3><p>{d.note}</p><div className="product-specs"><span>{d.kcal}<small> kcal</small></span><span className="sweetness" aria-label={`甘さ5段階中${d.sweetness}`}>{Array.from({length:5},(_,i)=><i key={i} className={i<d.sweetness?'filled':''}/>)}<small>甘さ</small></span></div></div></button><div className="product-bottom"><strong>{money(d.price)}</strong>{obs&&obs.visits>1&&<span className="revisit"><Heart size={9}/>{obs.visits}回</span>}<button className="round-button" aria-label={`${d.name}をバッグに入れる`} onClick={()=>add(d.id)}><Plus size={15}/></button></div>
            </article>;
          })}</div>
          <div className="catalog-note"><span>ALL MADE UP. ALL LOOKING GOOD.</span><p>架空のドーナツ店です。価格・カロリー・味・食感・重量は、この体験のための設定値です。</p></div>
        </section>
        <aside className="assistant-column"><div className="assistant-card">{assistant}</div>{wishForm('wish')}</aside>
      </div>
      <section className="live-lab"><div className="lab-top"><div><span className="eyebrow"><Zap size={13}/> LIVE EXPERIENCE LAB</span><h2>いま、どんなふうに見えてる？</h2></div><div className="lab-actions"><button onClick={()=>{live.leave();live.setEnabled(!live.enabled);}}>{live.enabled?<Pause size={13}/>:<Play size={13}/>} {live.enabled?'接客を一時停止':'接客を再開'}</button><button onClick={reset}><RotateCcw size={13}/> 記録をリセット</button></div></div><div className="lab-stats"><div><span>SAMPLING</span><strong>1<span> sec</span></strong><small>変更があるときだけ判定</small></div><div><span>OBSERVED</span><strong>{live.snapshot.totalVisits}<span> 回</span></strong><small>{live.snapshot.uniqueViewed}種類を見比べています</small></div><div><span>JEV UPDATES</span><strong>{String(live.updates).padStart(2,'0')}</strong><small>{live.busy?'最新の閲覧を分析中':live.updates?'実APIから返った判定':'商品に触れるとスタート'}</small></div><div><span>ROUND TRIP</span><strong>{live.result?.latency??'—'}<span> ms</span></strong><small>直近の実測値</small></div></div><button className="inspector-toggle" aria-expanded={inspector} onClick={()=>setInspector(!inspector)}>閲覧データと、Jevの判断をのぞく <ChevronDown size={14}/></button>{inspector&&<div className="inspector"><div><h3>最近の「気になる」</h3>{live.snapshot.observations.slice(0,6).map(o=><div className="observation-row" key={o.id}><span>{findDonut(o.id).name}</span><small>{o.visits}回 · {(o.recentMs/1000).toFixed(1)}秒</small><meter min={0} max={Math.max(1,...live.snapshot.observations.map(v=>v.attention))} value={o.attention}/></div>)}{!live.snapshot.observations.length&&<p>まだ記録がありません。</p>}</div><div><h3>気分の仮説を支持する確率</h3>{moodKeys.map(key=><div className="hypothesis-row" key={key}><span>{moods[key].label}</span><div><i style={{width:`${(live.result?.moods[key]??0)*100}%`}}/></div><small>{live.result?`${Math.round(live.result.moods[key]*100)}%`:'—'}</small></div>)}</div><div><h3>判定の履歴</h3>{live.history.map(row=><div className="history-row" key={row.number}><span>#{row.number} <small>{row.time}</small></span><strong>{actionLabels[row.action]} <small>{row.mood==='explore'?'探索中':moods[row.mood as Mood].label}</small></strong></div>)}</div><div className="action-inspector"><h3>接客の選択</h3><p>表示：{actionLabels[action]} · {adaptive ? '接客を選ぶ' : 'おすすめを表示'}{assistance.quiet ? ' · 見守り指定中' : ''}</p>{live.result && <><p>Jevの選択：{actionLabels[live.result.assistance.action]} · confidence {live.result.assistance.confidence.toFixed(2)}</p>{Object.entries(live.result.assistance.probabilities).map(([key,value]) => <div className="hypothesis-row" key={key}><span>{actionLabels[key as AssistAction]}</span><div><i style={{width:`${value!*100}%`}}/></div><small>{Math.round(value!*100)}%</small></div>)}<small>候補間の分布です。接客の正しさや満足度の確率ではありません。</small></>}</div><div className="action-inspector"><h3>お手伝いへの反応</h3><p>直近40件・このページ内のみ。切り替え比較は探索用で、効果の証明ではありません。</p>{assistEvents.length ? assistEvents.map(event => <div className="assist-event" key={event.id}><small>{event.time} · {event.mode === 'adaptive' ? '接客選択' : '推薦表示'}</small><span>{actionLabels[event.action]} → {event.outcome}</span></div>) : <p>比較を開く・質問に答える・感想を伝えると記録されます。</p>}</div><div className="rule-inspector"><h3>ルールで集計 → Jevが気分を判断</h3><p>数値条件に合う商品へ、注目がどれだけ集まったか。割合は好みの確率ではありません。{live.result ? '直近の判定に使ったデータです。' : '判定前の閲覧データです。'}</p><div className="rule-grid">{moodKeys.map(key=><div className="rule-row" key={key}><div><strong>{moods[key].label}</strong><small>{evidence[key].condition} · 対象{evidence[key].candidateIds.length}品</small></div><span>{Math.round(evidence[key].attentionShare*100)}<small>% 注目</small></span></div>)}</div></div><p className="technical-note">{live.result?.model??'jev-latest'} · {live.requests} requests · {live.result?.tokens??0} tokens / 直近 · 18の気分の仮説＋20商品の適合度＋接客行動と質問候補を同時に判定。質問への回答・辞退・接客モードの変更も送ります。閲覧の入退場・ひと言・フィルター・バッグが変わった時だけ送ります。滞在秒数は次の操作時に反映。応答中の重複送信と別タブでの通信はしません。推薦欄を見る行動は関心データに加えません。</p></div>}</section>
    </main>
    <footer><span className="brand">loop<span>®</span></span><p>まるいものから、あたらしい出会い。</p><span>FICTIONAL DONUT SHOP · LOCAL POC</span></footer>
    <button className="mobile-assistant" onClick={()=>setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen}><Face expression={face}/><span><small>JEV · {live.updates?`${live.updates}回更新`:'見守っています'}</small><strong>{line}</strong></span><ChevronRight size={18}/></button>
    <dialog ref={guideRef} className="mobile-guide-dialog" aria-label="ジェヴのおすすめ" onCancel={()=>setMobileOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setMobileOpen(false);}}><section className="mobile-guide"><button className="close-guide" aria-label="おすすめを閉じる" onClick={()=>setMobileOpen(false)}><X size={20}/></button>{assistant}{wishForm('wish-mobile')}</section></dialog>
    <dialog ref={comparisonRef} className="comparison-dialog" aria-label="ドーナツを比較" onCancel={() => setComparison(null)} onClick={e => { if(e.target === e.currentTarget) setComparison(null); }}><button className="dialog-close" aria-label="比較を閉じる" onClick={() => setComparison(null)}><X size={20}/></button><span className="eyebrow">SIDE BY SIDE</span><h2>どっちの気分？</h2><p>味や食感の違いを、ゆっくり見比べて。</p>{comparison && <><div className="comparison-products">{comparison.map(id => { const d = findDonut(id); return <div key={id}><DonutImage id={id}/><h3>{d.name}</h3><p>{d.note}</p><button className="guide-primary" onClick={() => { record('compare', `バッグに入れた：${d.name}`); add(id); setComparison(null); }}>{money(d.price)} <Plus size={15}/><span className="sr-only">{d.name}を比較からバッグに入れる</span></button></div>; })}</div><table className="comparison-table"><caption>商品の設定値（強度は5段階）</caption><thead><tr><th scope="col">比べること</th>{comparison.map(id => <th scope="col" key={id}>{findDonut(id).name}</th>)}</tr></thead><tbody>{(['price','kcal','portionGrams','sweetness','richness','chewiness','crispness','fluffiness','creaminess','messiness'] as const).map(key => <tr key={key}><th scope="row">{({ price:'価格',kcal:'カロリー',portionGrams:'大きさ',sweetness:'甘さ',richness:'濃厚さ',chewiness:'もちもち',crispness:'さっくり',fluffiness:'ふんわり',creaminess:'クリーム感',messiness:'こぼれやすさ' })[key]}</th>{comparison.map(id => <td key={id}>{key === 'price' ? money(findDonut(id)[key]) : `${findDonut(id)[key]}${key === 'kcal' ? ' kcal' : key === 'portionGrams' ? ' g' : ' / 5'}`}</td>)}</tr>)}</tbody></table><button className="guide-feedback" onClick={() => { record('compare','役に立った'); setComparison(null); setToast('比較への感想を記録しました'); }}>比べやすかった</button></>}</dialog>
    {toast&&<div className="toast" role="status"><Check size={15}/>{toast}</div>}
    <dialog ref={detailRef} className="product-dialog" onCancel={()=>{live.leave();setDetail(null);}} onClick={e=>{if(e.target===e.currentTarget){live.leave();setDetail(null);}}}>{detail&&(()=>{const d=findDonut(detail);return <div className="detail-content"><button className="dialog-close" aria-label="商品を閉じる" onClick={()=>{live.leave();setDetail(null);}}><X size={20}/></button><DonutImage id={d.id}/><span className="eyebrow">{d.en.toUpperCase()}</span><h2>{d.name}</h2><p>{d.note}</p><div className="detail-specs"><span><strong>{d.kcal}</strong> kcal</span><span>甘さ <strong>{d.sweetness}</strong> / 5</span><span>濃厚さ <strong>{d.richness}</strong> / 5</span></div><div className="preparation-tags"><span>{d.method==='baked'?'焼きドーナツ':'揚げドーナツ'}</span><span>1個 {d.portionGrams}g</span></div><details className="product-attributes"><summary>味と食感をもっと見る <ChevronDown size={13}/></summary><div>{(Object.keys(attributeLabels) as Attribute[]).map(key=><div className="attribute-row" key={key}><span>{attributeLabels[key]}</span><meter min={1} max={5} value={d[key]} aria-label={attributeLabels[key]}/><small>{d[key]} / 5</small></div>)}</div></details><button className="primary-button" onClick={()=>{add(d.id);live.leave();setDetail(null);}}>バッグに入れる <span>{money(d.price)}</span><Plus size={17}/></button><small>商品を閉じると、ジェヴのおすすめを見られます。</small></div>;})()}</dialog>
    <dialog ref={basketRef} className="basket-dialog" onCancel={()=>setShowBasket(false)} onClick={e=>{if(e.target===e.currentTarget)setShowBasket(false);}}><button className="dialog-close" aria-label="バッグを閉じる" onClick={()=>setShowBasket(false)}><X size={20}/></button><span className="eyebrow">YOUR SWEET FINDS</span><h2>今日、出会ったドーナツ。</h2>{basket.length?donuts.filter(d=>basket.includes(d.id)).map(d=><div className="basket-row" key={d.id}><DonutImage id={d.id}/><div><strong>{d.name}</strong><span>{money(d.price)} × {basket.filter(id=>id===d.id).length}</span></div><button aria-label={`バッグから${d.name}を1個外す`} className="round-button" onClick={()=>{setBasket(items=>{const index=items.indexOf(d.id);return items.filter((_,i)=>i!==index);});live.touchActivity();}}><Minus size={14}/></button></div>):<p className="empty-bag">まだ空っぽ。気になる子を見つけにいこう。</p>}<div className="basket-total"><span>{basket.length} DONUTS</span><strong>{money(total)}</strong></div><button className="primary-button" onClick={()=>setShowBasket(false)}>もう少し、眺めていく <ArrowRight size={16}/></button><small>ローカルの体験デモです。注文・決済は行いません。</small></dialog>
  </div>;
}
