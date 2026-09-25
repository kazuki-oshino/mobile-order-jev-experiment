import type { AssistanceContext } from './assistance';
import { attributeLabels, donuts, moodKeys, moodRules, type Attribute, type DonutId, type Filter } from './catalog';

export type Visit = { id: DonutId; start: number; end: number; source: 'pointer' | 'touch' | 'keyboard' };
export type Observation = { id: DonutId; visits: number; dwellMs: number; recentMs: number; lastSeenAgoMs: number; attention: number };
export type Snapshot = { assistance?: AssistanceContext; observations: Observation[]; activeId: DonutId | null; recentSequence: DonutId[]; totalVisits: number; uniqueViewed: number; filter: Filter; note: string; basket: DonutId[] };

export class AttentionTracker {
  private visits: Visit[] = [];
  private active: Omit<Visit, 'end'> | null = null;
  private lifetime = new Map<DonutId, { visits: number; dwellMs: number }>();
  revision = 0;
  lastActivity = 0;
  enter(id: DonutId, now: number, source: Visit['source'] = 'pointer') {
    if (this.active?.id === id) return;
    this.leave(now);
    this.active = { id, start: now, source };
    const old = this.lifetime.get(id) ?? { visits: 0, dwellMs: 0 };
    this.lifetime.set(id, { ...old, visits: old.visits + 1 });
    this.revision++;
    this.lastActivity = now;
  }
  leave(now: number, id?: DonutId) {
    if (!this.active || (id && this.active.id !== id)) return;
    const visit = { ...this.active, end: now };
    this.visits.push(visit);
    const old = this.lifetime.get(visit.id)!;
    this.lifetime.set(visit.id, { ...old, dwellMs: old.dwellMs + Math.max(0, now - visit.start) });
    this.visits = this.visits.filter(v => now - v.end < 45000).slice(-100);
    this.active = null;
    this.revision++;
    this.lastActivity = now;
  }
  clear() { this.revision++; this.visits = []; this.active = null; this.lifetime.clear(); this.lastActivity = 0; }
  snapshot(now: number, filter: Filter, note: string, basket: DonutId[]): Snapshot {
    // タップ後の置きっぱなし・ポインタの放置を無限の関心として扱わない。
    const activeEnd = this.active ? Math.min(now, this.active.start + 8000) : now;
    const recentVisits = [...this.visits, ...(this.active ? [{ ...this.active, end: activeEnd }] : [])].filter(v => now - v.end < 30000);
    const observations = [...this.lifetime].map(([id, total]) => {
      const related = recentVisits.filter(v => v.id === id);
      const activeMs = this.active?.id === id ? Math.max(0, activeEnd - this.active.start) : 0;
      const recentMs = related.reduce((sum, v) => sum + Math.min(8000, Math.max(0, v.end - Math.max(v.start, now - 30000))), 0);
      const attention = related.reduce((sum, v) => {
        const dwellSeconds = Math.min(8, Math.max(0, v.end - v.start) / 1000);
        const recency = Math.exp(-Math.max(0, now - v.end) / 6500);
        // 通過しただけのカードより、再訪・滞在と直近6.5秒の傾向を重視する。
        return sum + (0.2 + dwellSeconds) * recency;
      }, 0);
      const lastEnd = Math.max(0, ...related.map(v => v.end));
      return { id, visits: total.visits, dwellMs: Math.round(total.dwellMs + activeMs), recentMs: Math.round(recentMs), lastSeenAgoMs: lastEnd ? Math.round(now - lastEnd) : 30000, attention: Math.round(attention * 100) / 100 };
    }).sort((a, b) => b.attention - a.attention);
    return { observations, activeId: this.active && now - this.active.start < 8000 ? this.active.id : null, recentSequence: recentVisits.slice(-8).map(v => v.id), totalVisits: [...this.lifetime.values()].reduce((n, v) => n + v.visits, 0), uniqueViewed: this.lifetime.size, filter, note, basket };
  }
}

export function preferenceSummary(snapshot: Snapshot) {
  const total = snapshot.observations.reduce((n, o) => n + o.attention, 0);
  if (!total) return null;
  const average = (key: 'sweetness' | 'kcal' | 'price' | 'richness' | 'portionGrams' | Attribute) => Math.round(snapshot.observations.reduce((n, o) => n + donuts.find(d => d.id === o.id)![key] * o.attention, 0) / total * 10) / 10;
  return { sweetness: average('sweetness'), kcal: average('kcal'), price: average('price'), richness: average('richness'), portionGrams: average('portionGrams'), ...Object.fromEntries((Object.keys(attributeLabels) as Attribute[]).map(key => [key, average(key)])) };
}

// 条件への一致と「その好みである確率」は別。ここでは商品の事実と注目の割合だけを集計する。
export function ruleEvidence(snapshot: Snapshot) {
  const total = snapshot.observations.reduce((sum, o) => sum + o.attention, 0);
  return Object.fromEntries(moodKeys.map(key => {
    const candidates = donuts.filter(moodRules[key].matches).map(d => d.id);
    const viewed = snapshot.observations.filter(o => candidates.includes(o.id) && o.attention > 0);
    return [key, {
      condition: moodRules[key].label,
      candidateIds: candidates,
      viewedMatches: viewed.map(o => o.id),
      attentionShare: total ? Math.round(viewed.reduce((sum, o) => sum + o.attention, 0) / total * 100) / 100 : 0,
    }];
  }));
}
