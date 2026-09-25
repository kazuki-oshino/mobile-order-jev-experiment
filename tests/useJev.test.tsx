import { initialAssistance, type AssistanceContext } from '../src/assistance';
// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useJev } from '../src/useJev';
import { donuts, moodKeys, type DonutId, type Filter } from '../src/catalog';
import type { Evaluation } from '../src/jev';
import type { Snapshot } from '../src/attention';

const api = vi.hoisted(()=>({ evaluate: vi.fn() }));
vi.mock('../src/jev',()=>({evaluate:api.evaluate}));
let hook: ReturnType<typeof useJev>;
let root: Root;
let host: HTMLDivElement;
let pending: { resolve: (value: Evaluation)=>void; reject:(error:Error)=>void; observed:Snapshot; signal:AbortSignal }[];
const basket: [] = [];
function Harness({note='',filter='all',items=basket,assistance=initialAssistance}:{note?:string;filter?:Filter;items?:DonutId[];assistance?:AssistanceContext}){hook=useJev(note,filter,items,assistance);return null;}
function response(observed:Snapshot):Evaluation{return {assistance:{action:'watch',probabilities:{watch:1},confidence:1,pair:[],topic:null},observed,moods:Object.fromEntries(moodKeys.map(k=>[k,k==='sweet'?.9:.2])) as Evaluation['moods'],ranking:donuts.map(d=>({id:d.id,score:.5})),latency:900,model:'jev-test',tokens:100};}
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-19T10:00:00Z'));
  vi.spyOn(document,'hidden','get').mockReturnValue(false);
  pending=[];api.evaluate.mockReset();api.evaluate.mockImplementation((observed:Snapshot,signal:AbortSignal)=>new Promise<Evaluation>((resolve,reject)=>pending.push({resolve,reject,observed,signal})));
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Harness/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.useRealTimers();});
const tick=async(ms=1000)=>{await act(async()=>{vi.advanceTimersByTime(ms);});};
const enter=async(id:DonutId='custard')=>{await act(async()=>hook.enter(id,'pointer'));};
const complete=async()=>{await act(async()=>{const p=pending.at(-1)!;p.resolve(response(p.observed));});};

describe('1秒の接客ループ',()=>{
  it('閲覧前は送らず、開始後も応答中の通信を重ねない',async()=>{
    await tick(3000);expect(api.evaluate).not.toHaveBeenCalled();
    await enter();await tick();expect(api.evaluate).toHaveBeenCalledTimes(1);
    await tick(4000);expect(api.evaluate).toHaveBeenCalledTimes(1);
    await act(async()=>pending[0].resolve(response(pending[0].observed)));
    expect(hook.updates).toBe(1);
    await tick();expect(api.evaluate).toHaveBeenCalledTimes(1);
    await enter('plain');await tick();expect(api.evaluate).toHaveBeenCalledTimes(2);
  });
  it('同じカードを眺めたままなら60秒経っても更新しない',async()=>{
    await enter();await tick();await complete();
    const observed=hook.result!.observed;
    for(let i=0;i<60;i++) await tick();
    expect(api.evaluate).toHaveBeenCalledTimes(1);expect(hook.updates).toBe(1);expect(hook.idle).toBe(true);
    expect(hook.result!.observed).toBe(observed);
    await enter();await act(async()=>hook.touchActivity());await tick();
    expect(api.evaluate).toHaveBeenCalledTimes(1);
  });
  it('カードを離れた時に滞在を反映し、再訪も別の入力として送る',async()=>{
    await enter();await tick();await complete();await tick(4000);
    await act(async()=>hook.leave('custard'));await tick();
    expect(api.evaluate).toHaveBeenCalledTimes(2);expect(pending[1].observed.activeId).toBeNull();
    expect(pending[1].observed.observations[0].dwellMs).toBe(5000);
    await complete();await act(async()=>hook.leave('custard'));await tick();expect(api.evaluate).toHaveBeenCalledTimes(2);
    await enter();await tick();expect(pending[2].observed.observations[0].visits).toBe(2);
  });
  it('1秒内の移動と応答待ち中の移動を最新状態にまとめる',async()=>{
    await enter();await enter('plain');await enter('matcha');await tick();
    expect(api.evaluate).toHaveBeenCalledTimes(1);expect(pending[0].observed.activeId).toBe('matcha');
    await enter('lemon');await enter('oat');await tick(3000);expect(api.evaluate).toHaveBeenCalledTimes(1);
    await complete();await tick();expect(api.evaluate).toHaveBeenCalledTimes(2);
    expect(pending[1].observed.activeId).toBe('oat');await complete();await tick();expect(api.evaluate).toHaveBeenCalledTimes(2);
  });
  it('ひと言・フィルター・バッグは変更とクリアを送り、同じ値の再描画では送らない',async()=>{
    const states:Parameters<typeof Harness>[0][]=[{note:'もちもち'},{},{filter:'light'},{},{items:['plain']},{},];
    for(const [i,props] of states.entries()){
      await act(async()=>root.render(<Harness {...props}/>));await tick();
      expect(api.evaluate).toHaveBeenCalledTimes(i+1);await complete();
      await act(async()=>root.render(<Harness {...props}/>));await tick();expect(api.evaluate).toHaveBeenCalledTimes(i+1);
    }
  });
  it('判定済みの入力は一時停止・再開でも再送せず、中断した入力は再試行する',async()=>{
    await enter();await tick();await complete();
    await act(async()=>hook.setEnabled(false));await act(async()=>hook.setEnabled(true));await tick();
    expect(api.evaluate).toHaveBeenCalledTimes(1);
    await enter('plain');await tick();await act(async()=>hook.setEnabled(false));
    await act(async()=>hook.setEnabled(true));await tick();expect(api.evaluate).toHaveBeenCalledTimes(3);
    expect(pending[2].observed.activeId).toBe('plain');
  });
  it('停止後に古い応答が届いても画面を更新しない',async()=>{
    await enter();await tick();await act(async()=>hook.setEnabled(false));
    expect(pending[0].signal.aborted).toBe(true);
    await act(async()=>pending[0].resolve(response(pending[0].observed)));
    await tick(4000);expect(hook.updates).toBe(0);expect(api.evaluate).toHaveBeenCalledTimes(1);
  });
  it('リセット後に前の関心や応答を持ち越さない',async()=>{
    await enter();await tick();await act(async()=>hook.reset());
    await act(async()=>pending[0].resolve(response(pending[0].observed)));
    expect(hook.snapshot.totalVisits).toBe(0);expect(hook.result).toBeUndefined();expect(hook.requests).toBe(0);
  });
  it('明示した希望を書き換えたら、古い条件の応答は破棄する',async()=>{
    await enter();await tick();await act(async()=>root.render(<Harness note="200kcal以内"/>));
    await act(async()=>pending[0].resolve(response(pending[0].observed)));
    expect(hook.result).toBeUndefined();await tick();
    expect(pending[1].observed.note).toBe('200kcal以内');
  });
  it('エラーを表示して連続失敗を止め、再開操作で再試行する',async()=>{
    await enter();await tick();await act(async()=>pending[0].reject(new Error('rate limited')));
    expect(hook.error).toBe('rate limited');await tick(5000);expect(api.evaluate).toHaveBeenCalledTimes(1);
    await act(async()=>hook.retry());await tick();expect(api.evaluate).toHaveBeenCalledTimes(2);
  });
  it('別タブになったら進行中の判定を中止する',async()=>{
    await enter();await tick();vi.spyOn(document,'hidden','get').mockReturnValue(true);
    await act(async()=>document.dispatchEvent(new Event('visibilitychange')));
    expect(pending[0].signal.aborted).toBe(true);
    await act(async()=>pending[0].resolve(response(pending[0].observed)));
    await tick(4000);expect(hook.updates).toBe(0);expect(api.evaluate).toHaveBeenCalledTimes(1);
  });
});

it('回答・見守り指定の変更を送信し、変更前の応答を適用しない', async () => {
  await enter(); await tick();
  const answered = { ...initialAssistance, answers: { texture: 'もちもち' } };
  await act(async () => root.render(<Harness assistance={answered}/>));
  await complete(); expect(hook.result).toBeUndefined();
  await tick(); expect(pending[1].observed.assistance?.answers.texture).toBe('もちもち');
  await complete(); expect(hook.updates).toBe(1);
  await act(async () => root.render(<Harness assistance={{ ...answered }}/>));
  await tick(); expect(api.evaluate).toHaveBeenCalledTimes(2);
  await act(async () => root.render(<Harness assistance={{ ...answered, quiet: true }}/>));
  expect(hook.result).toBeUndefined();
  await tick(); expect(pending[2].observed.assistance?.quiet).toBe(true);
});
