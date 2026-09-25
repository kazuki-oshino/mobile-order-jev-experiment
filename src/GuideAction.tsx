import { ArrowRight, Eye, GitCompareArrows, MessageCircle, Sparkles } from 'lucide-react';
import { actionLabels, questionBank, type AssistanceDecision, type AssistAction, type QuestionTopic } from './assistance';
import { findDonut, type DonutId } from './catalog';

const icons = { compare: GitCompareArrows, ask: MessageCircle, recommend: Sparkles, watch: Eye };
const copy = {
  compare: ['ふたつの違い、並べてみようか。', '最近見た2品を、味・食感・大きさで見比べられます。'],
  ask: ['選ぶヒントを、ひとつだけ。', '答えなくても大丈夫。気分に近いものがあれば教えてね。'],
  recommend: ['いまの気分に、こんなドーナツ。', '気になるものから、ゆっくりどうぞ。'],
  watch: ['どうぞ、あなたのペースで。', '声をかけてほしくなったら、ひと言教えてね。'],
} as const;

export function GuideAction({ action, decision, quiet, ready, onCompare, onAnswer, onDismiss, onQuiet }: {
  action: AssistAction; decision?: AssistanceDecision; quiet: boolean; ready: boolean;
  onCompare: (pair: DonutId[]) => void;
  onAnswer: (topic: QuestionTopic, answer: string) => void;
  onDismiss: () => void; onQuiet: () => void;
}) {
  const Icon = icons[action];
  const question = decision?.topic ? questionBank[decision.topic] : null;
  return <section className={`guide-action guide-${action}`} aria-label="いまの接客">
    <div className="guide-action-label"><Icon size={15}/><span>{actionLabels[action]}</span><small>{ready ? 'いまのお手伝い' : 'あなたのペースで'}</small></div>
    <h2>{copy[action][0]}</h2><p>{copy[action][1]}</p>
    {action === 'compare' && decision?.pair.length === 2 && <div className="compare-offer"><p>{decision.pair.map(id => findDonut(id).name).join(' と ')}</p><button className="guide-primary" onClick={() => onCompare(decision.pair)}>ふたつの違いを見る <ArrowRight size={16}/></button></div>}
    {action === 'ask' && question && <fieldset className="guide-question"><legend>{question.title}</legend><div>{question.options.map(answer => <button key={answer} onClick={() => onAnswer(decision!.topic!, answer)}>{answer}</button>)}</div></fieldset>}
    <div className="guide-controls">
      {action !== 'watch' && <button onClick={onDismiss}>このお手伝いは今は不要</button>}
      <button aria-pressed={quiet} onClick={onQuiet}>{quiet ? 'お手伝いを再開する' : '今は、静かに見たい'}</button>
    </div>
  </section>;
}
