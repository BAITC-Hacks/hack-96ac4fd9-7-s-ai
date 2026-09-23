import type { CreateMatchInput, Language } from '../../../shared/types.js';
import type { Contractor } from './catalog.js';

const LANGUAGE_NAMES: Record<Language, string> = { ru: 'орыс', kz: 'қазақ', en: 'ағылшын' };
const money = (amount: number) => new Intl.NumberFormat('kk-KZ').format(amount).replaceAll('\u00a0', ' ');

export interface ExplanationChoices {
  id: string;
  evidence: string[];
  facts: string[];
}

export function explanationChoices(profile: Contractor, input: CreateMatchInput): ExplanationChoices {
  const sourceSentences = [...new Intl.Segmenter('ru', { granularity: 'sentence' }).segment(profile.description)]
    .map(part => part.segment.replace(/\s+/g, ' ').trim())
    .filter(sentence => sentence.length >= 25 && sentence.length <= 300);
  const usefulSentences = sourceSentences.filter(sentence => !/топ[-\s]?\d|лучши|идеаль|безупреч/iu.test(sentence));
  const sentences = usefulSentences.length > 0 ? usefulSentences : sourceSentences;
  // Prefer actual service details over greetings or a sentence containing only a name.
  const evidenceWeight = (sentence: string) => {
    const words = sentence.toLowerCase();
    const numeric = /\d/u.test(sentence) ? 3 : 0;
    const concrete = /специализ|оформлен|сценари|формат|язык|работа|провод|веду|опыт|инструмент|оборудован|гост|человек/iu.test(words) ? 2 : 0;
    const greeting = /привет|меня зовут|всем добр/iu.test(words) ? -4 : 0;
    return numeric + concrete + greeting + Math.min(sentence.length, 200) / 200;
  };
  const evidence = [...new Set(sentences)].map((text, index) => ({ text, index }))
    .sort((left, right) => evidenceWeight(right.text) - evidenceWeight(left.text) || left.index - right.index)
    .slice(0, 6).map(item => item.text);
  if (evidence.length === 0) {
    const clean = profile.description.replace(/\s+/g, ' ').trim();
    const excerpt = clean.slice(0, 260);
    const boundary = excerpt.lastIndexOf(' ');
    evidence.push(clean.length <= 260 ? clean : `${boundary > 0 ? excerpt.slice(0, boundary) : excerpt}…`);
  }
  const price = `бастапқы бағасы ${money(profile.priceFromKzt)} ₸`;
  const budget = profile.priceFromKzt === input.budgetKzt ? 'бюджетке тең' : `бюджеттен ${money(input.budgetKzt - profile.priceFromKzt)} ₸ төмен`;
  const base = `Дерек күнтізбесінде ${input.eventDate} күні бос; «${input.eventType}» форматын қабылдайды; ${price}, ${budget}`;
  const language = input.language ? `${LANGUAGE_NAMES[input.language]} тілінде жұмыс істейді` : `жұмыс тілдері: ${profile.languages.map(item => LANGUAGE_NAMES[item]).join(', ')}`;
  const duration = input.durationHours === undefined ? null : profile.maxHours === null
    ? `сұралған ${input.durationHours} сағатқа қатысу ұзақтығы бойынша шектеу қолданылмайды`
    : `сұралған ${input.durationHours} сағатқа жеткілікті, ең көбі ${profile.maxHours} сағат`;
  const facts = [`${base}; ${language}${duration ? `; ${duration}` : ''}.`];
  facts.push(`${base}; ${language}.`);
  if (duration) facts.push(`${base}; ${duration}.`);
  return { id: profile.id, evidence, facts: [...new Set(facts)] };
}

export function assembleExplanation(choices: ExplanationChoices, evidenceIndex = 0, factIndex = 0): string {
  const evidence = choices.evidence[evidenceIndex];
  const fact = choices.facts[factIndex];
  if (!evidence || !fact) throw new Error('Invalid explanation selection.');
  const excerpt = evidence.replace(/[.!?]+$/u, '');
  return `Профильдегі дерек: «${excerpt}». ${fact}`;
}

export function templateExplanation(profile: Contractor, input: CreateMatchInput): string {
  const choices = explanationChoices(profile, input);
  const terms = input.eventType === 'корпоратив' ? ['корпоратив', 'бизнес', 'делов'] : [input.eventType.slice(0, 5)];
  const selected = choices.evidence.findIndex(text => terms.some(term => text.toLowerCase().includes(term)));
  return assembleExplanation(choices, selected >= 0 ? selected : 0);
}
