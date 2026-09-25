import { donuts, filters, type DonutId } from './catalog';
import type { Snapshot } from './attention';

export const actionLabels = { compare: '比較する', ask: '一問聞く', recommend: '提案する', watch: '見守る' } as const;
export type AssistAction = keyof typeof actionLabels;
export const questionBank = {
  texture: { title: '今日は、どんな食感に惹かれる？', options: ['もちもち', 'さっくり', 'ふんわり'] },
  sweetness: { title: '甘さは、どのくらいの気分？', options: ['甘さ控えめ', 'ほどよく甘い', 'しっかり甘い'] },
  portion: { title: 'どんなひと休みにしよう？', options: ['小さめをひとつ', 'しっかり満足したい', '大きさは気にしない'] },
} as const;
export type QuestionTopic = keyof typeof questionBank;
export type AssistanceContext = {
  mode: 'adaptive' | 'fixed';
  quiet: boolean;
  answers: Partial<Record<QuestionTopic, string>>;
  dismissed: AssistAction[];
};
export const initialAssistance: AssistanceContext = { mode: 'adaptive', quiet: false, answers: {}, dismissed: [] };
export type AssistanceDecision = {
  action: AssistAction;
  probabilities: Partial<Record<AssistAction, number>>;
  confidence: number;
  pair: DonutId[];
  topic: QuestionTopic | null;
};
export type AssistEvent = { id: number; time: string; mode: AssistanceContext['mode']; action: AssistAction; outcome: string };

// フィルターとバッグは確定条件。比較対象は直近に見た実在商品からのみ作る。
export function assistanceOptions(snapshot: Snapshot) {
  const context = snapshot.assistance ?? initialAssistance;
  const eligible = donuts.filter(d => filters.find(f => f.id === snapshot.filter)!.includes(d) && !snapshot.basket.includes(d.id)).map(d => d.id);
  const pair = [...new Set([...snapshot.recentSequence].reverse())].filter(id => eligible.includes(id)).slice(0, 2).reverse();
  const topics = (Object.keys(questionBank) as QuestionTopic[]).filter(topic => !context.answers[topic]);
  const actions: Partial<Record<AssistAction, string>> = {
    watch: 'Let the shopper browse without suggesting a product or asking a question. Best when evidence is sparse, they want space, or no intervention would help.',
  };
  if (!context.quiet) {
    if (eligible.length && !context.dismissed.includes('recommend')) actions.recommend = 'Offer a small shortlist when an explicit wish or recent evidence is sufficient to suggest relevant products.';
    if (pair.length === 2 && !context.dismissed.includes('compare')) actions.compare = 'Offer a factual side-by-side comparison of comparisonPair. Especially useful for repeated back-and-forth viewing or an explicit wish to compare. Revisits alone are not proof of indecision.';
    if (topics.length && eligible.length && !context.dismissed.includes('ask')) actions.ask = 'Ask one optional question to clarify a useful missing preference. Choose only when the answer would help more than a direct suggestion. Do not repeat information already clear in note or shopperAnswers.';
  }
  return { actions, pair, topics, eligible };
}

export function effectiveAction(decision: AssistanceDecision | undefined, context: AssistanceContext, available: Partial<Record<AssistAction, string>>): AssistAction {
  if (context.quiet) return 'watch';
  const action = context.mode === 'fixed' && decision ? 'recommend' : decision?.action ?? 'watch';
  return available[action] ? action : 'watch';
}
