import { initialAssistance, type AssistAction, type AssistanceContext } from './assistance';
import { useEffect, useRef, useState } from 'react';
import { AttentionTracker, type Snapshot, type Visit } from './attention';
import type { DonutId, Filter } from './catalog';
import { evaluate, type Evaluation } from './jev';

export function useJev(note: string, filter: Filter, basket: DonutId[], assistance: AssistanceContext = initialAssistance) {
  const tracker = useRef(new AttentionTracker());
  const context = useRef({ note, filter, basket, assistance });
  context.current = { note, filter, basket, assistance };
  const [enabled, setEnabled] = useState(true);
  const [session, setSession] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => tracker.current.snapshot(Date.now(), filter, note, basket));
  const [result, setResult] = useState<Evaluation>();
  const [history, setHistory] = useState<{ number: number; action: AssistAction; mood: string; time: string; latency: number }[]>([]);
  const [requests, setRequests] = useState(0);
  const [updates, setUpdates] = useState(0);
  const [busy, setBusy] = useState(false);
  const [idle, setIdle] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(0);
  const updateCount = useRef(0);
  const lastCompletedInput = useRef<string | null>(null);
  // 経過時間・減衰・滞在中の秒数は変更トリガーにしない。入退場で滞在をまとめて反映する。
  const inputKey = () => JSON.stringify([tracker.current.revision, context.current.note, context.current.filter, context.current.basket, context.current.assistance]);
  const read = () => {
    const c = context.current;
    return { ...tracker.current.snapshot(Date.now(), c.filter, c.note, c.basket), assistance: c.assistance };
  };
  useEffect(() => {
    if (!enabled) { setBusy(false); return; }
    let alive = true;
    let inFlight = false;
    let blocked = false;
    let controller: AbortController | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    setError('');
    const tick = async () => {
      const key = inputKey();
      const quiet = document.hidden || key === lastCompletedInput.current;
      setIdle(quiet);
      if (inFlight || blocked || quiet) return;
      const current = read();
      setSnapshot(current);
      if (!current.observations.length && !current.note.trim() && current.filter === 'all' && !current.basket.length && !Object.keys(current.assistance!.answers).length && !current.assistance!.quiet && !current.assistance!.dismissed.length && lastCompletedInput.current === null) { setIdle(true); return; }
      inFlight = true;
      setBusy(true);
      setRequests(n => n + 1);
      controller = new AbortController();
      const signal = controller.signal;
      deadline = setTimeout(() => controller?.abort('timeout'), 12000);
      try {
        const next = await evaluate(current, signal);
        // カーソル移動は継続中なので最新の完了結果を使う。明示的な条件変更・停止・リセット後の結果は捨てる。
        if (!alive || signal.aborted || document.hidden || current.note !== context.current.note || current.filter !== context.current.filter || current.basket.join(',') !== context.current.basket.join(',') || JSON.stringify(current.assistance) !== JSON.stringify(context.current.assistance)) return;
        lastCompletedInput.current = key;
        setIdle(inputKey() === key);
        setResult(next);
        setUpdatedAt(Date.now());
        setUpdates(++updateCount.current);
        const best = Object.entries(next.moods).sort((a, b) => b[1] - a[1])[0];
        setHistory(rows => [{ number: updateCount.current, action: next.assistance.action, mood: best[1] >= .55 ? best[0] : 'explore', time: new Date().toLocaleTimeString('ja-JP', { hour12: false }), latency: next.latency }, ...rows].slice(0, 6));
      } catch (cause) {
        if (!alive || document.hidden || signal.reason === 'hidden') return;
        blocked = true;
        setError(signal.aborted ? '応答がタイムアウトしました。接客を再開してください。' : cause instanceof Error ? cause.message : '通信を確認して接客を再開してください。');
      } finally {
        clearTimeout(deadline);
        inFlight = false;
        if (alive) setBusy(false);
      }
    };
    const onVisibility = () => {
      if (document.hidden) { tracker.current.leave(Date.now()); controller?.abort('hidden'); setIdle(true); }
    };
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      const started = Date.now();
      await tick();
      // 1秒以内なら次の境界まで待つ。遅い応答の直後は最新の状態を送り、待ち行列は作らない。
      if (alive) timer = setTimeout(loop, Math.max(0, 1000 - (Date.now() - started)));
    };
    timer = setTimeout(loop, 1000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { alive = false; clearTimeout(timer); clearTimeout(deadline); controller?.abort(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [enabled, session]);
  return {
    snapshot, result: result && result.observed.note === note && result.observed.filter === filter && result.observed.basket.join(',') === basket.join(',') && JSON.stringify(result.observed.assistance) === JSON.stringify(assistance) ? result : undefined,
    history, enabled, setEnabled, requests, updates, busy, idle, error, updatedAt,
    enter: (id: DonutId, source: Visit['source']) => {
      if (!enabled || document.hidden) return;
      tracker.current.enter(id, Date.now(), source); setSnapshot(read());
    },
    leave: (id?: DonutId) => { tracker.current.leave(Date.now(), id); setSnapshot(read()); },
    touchActivity: () => { tracker.current.lastActivity = Date.now(); },
    retry: () => { lastCompletedInput.current = null; tracker.current.lastActivity = Date.now(); setError(''); setSession(n => n + 1); setEnabled(true); },
    reset: () => {
      lastCompletedInput.current = null; tracker.current.clear(); setSnapshot(read()); setResult(undefined); setError(''); setHistory([]); setRequests(0); setUpdates(0); updateCount.current = 0; setUpdatedAt(0); setSession(n => n + 1);
    },
  };
}
