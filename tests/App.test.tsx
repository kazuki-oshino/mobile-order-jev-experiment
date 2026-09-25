// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import App from '../src/App';
import { donuts, moodKeys } from '../src/catalog';
import type { Evaluation } from '../src/jev';

const api = vi.hoisted(() => ({ evaluate: vi.fn() }));
vi.mock('../src/jev', () => ({ evaluate: api.evaluate }));
let root: Root;
let host: HTMLDivElement;
let selected: 'ask' | 'compare' | 'recommend';
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); };
  selected = 'ask';
  api.evaluate.mockReset();
  api.evaluate.mockImplementation(async (observed): Promise<Evaluation> => ({
    observed, moods: Object.fromEntries(moodKeys.map(k => [k, .1])) as Evaluation['moods'],
    ranking: donuts.map(d => ({ id:d.id, score:.5 })), latency: 100, model:'fixture', tokens:100,
    assistance: { action: selected, topic:'texture', pair:['honey','berry'], probabilities:{ [selected]:1 }, confidence:1 },
  }));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<App/>));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.useRealTimers(); });
const click = async (label:string) => {
  const button = [...host.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent?.trim() === label);
  expect(button, label).toBeDefined(); await act(async () => button!.click());
};
const tick = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(1000); }); };
const start = async () => { await click('ハニー・ハグを見てみる'); await click('商品を閉じる'); await tick(); };

it('質問の回答を希望に加え、回答取り消しとリセットが反映される', async () => {
  await start(); await click('もちもち');
  expect(host.querySelector('[aria-label="質問に答えた希望"]')?.textContent).toContain('もちもち');
  await tick(); expect(api.evaluate.mock.lastCall![0].assistance.answers).toEqual({texture:'もちもち'});
  await click('もちもちの回答を取り消す'); await tick();
  expect(api.evaluate.mock.lastCall![0].assistance.answers).toEqual({});
  await click('記録をリセット');
  expect(host.querySelector('.assistant-card')?.textContent).toContain('どうぞ、あなたのペースで。');
  expect(host.querySelector('[aria-label="質問に答えた希望"]')).toBeNull();
});

it('比較表の値は商品データに一致し、比較からバッグに追加できる', async () => {
  selected = 'compare'; await start();
  await click('ベリー・キスを見てみる'); await click('商品を閉じる'); await tick();
  await click('ふたつの違いを見る');
  const dialog = host.querySelector('.comparison-dialog')!;
  expect(dialog.hasAttribute('open')).toBe(true);
  expect(dialog.textContent).toContain('245 kcal'); expect(dialog.textContent).toContain('278 kcal');
  const add = [...dialog.querySelectorAll('button')].find(b => b.textContent?.includes('ハニー・ハグを比較からバッグに入れる'))!;
  await act(async () => add.click());
  expect(host.querySelector('[aria-label="バッグを開く（1個）"]')).not.toBeNull();
  expect(dialog.hasAttribute('open')).toBe(false);
});

it('見守りは即時に推薦を隠し、固定表示への切替でも維持する', async () => {
  selected = 'recommend'; await start();
  expect(host.querySelector('.assistant-card .recommendations')).not.toBeNull();
  await click('今は、静かに見たい');
  expect(host.querySelector('.assistant-card .recommendations')).toBeNull();
  await click('おすすめを表示'); await tick();
  expect(host.querySelector('.assistant-card .recommendations')).toBeNull();
  await click('お手伝いを再開する'); await tick();
  expect(host.querySelector('.assistant-card .recommendations')).not.toBeNull();
});

it('辞退は次の入力に記録し、インスペクターに反応が残る', async () => {
  await start(); await click('このお手伝いは今は不要'); await tick();
  expect(api.evaluate.mock.lastCall![0].assistance.dismissed).toEqual(['ask']);
  expect(host.querySelector('.assistant-card .guide-question')).toBeNull();
  await click('閲覧データと、Jevの判断をのぞく');
  expect(host.querySelector('.inspector')?.textContent).toContain('一問聞く → 今は不要');
});
