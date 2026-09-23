import type { CreateMatchInput, MatchResult, ContractorCard, NotShownCandidate } from '../../../shared/types.js';
import type { Catalog, Contractor } from './catalog.js';
import { templateExplanation } from './explanations.js';
import { foundMessage, localeOf, noCategoryMessage, noMatchMessage, reasonText, type Exclusions } from './i18n.js';

export const RANKING_VERSION = 'description-groups-id-v1';
const FORMAT_GROUPS: Record<string, string[][]> = {
  свадьба: [['свад', 'wedding'], ['молодож', 'невест', 'жених'], ['церемон', 'регистрац']],
  той: [['той', 'тоя'], ['националь', 'традиц'], ['казах', 'қазақ']],
  корпоратив: [['корпоратив'], ['бизнес', 'делов'], ['форум', 'конференц']],
  конференция: [['конференц'], ['форум'], ['бизнес', 'делов']],
  юбилей: [['юбиле']],
  'день рождения': [['день рождения', 'дня рождения', 'днем рождения']],
};

export function descriptionScore(profile: Contractor, eventType: string): number {
  const words = profile.description.toLowerCase().replaceAll('ё', 'е').match(/[\p{L}\p{N}]+/gu) ?? [];
  const normalized = ` ${words.join(' ')} `;
  return (FORMAT_GROUPS[eventType] ?? []).filter(group => group.some(term => term.includes(' ')
    ? normalized.includes(` ${term} `) : words.some(word => word.startsWith(term)))).length;
}

const byId = (left: { id: string }, right: { id: string }) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

export function selectMatches(catalog: Catalog, input: CreateMatchInput): { result: MatchResult; selected: Contractor[] } {
  const locale = localeOf(input);
  const candidates = catalog.contractors.filter(profile => profile.city === input.city && profile.categories.includes(input.category));
  if (candidates.length === 0) {
    return { selected: [], result: { status: 'no_category', cards: [], candidatesBeforeCut: 0, notShown: [],
      message: noCategoryMessage(locale, input) } };
  }
  const excluded: Exclusions = { busy: 0, budget: 0, format: 0, language: 0, duration: 0 };
  const filteredOut: NotShownCandidate[] = [];
  const eligible = candidates.filter(profile => {
    const reasons = {
      busy: profile.busyDates.has(input.eventDate),
      budget: profile.priceFromKzt > input.budgetKzt,
      format: !profile.eventFormats.includes(input.eventType),
      language: input.language !== undefined && !profile.languages.includes(input.language),
      duration: input.durationHours !== undefined && profile.maxHours !== null && profile.maxHours < input.durationHours,
    };
    const failed = (Object.keys(reasons) as (keyof typeof reasons)[]).filter(key => reasons[key]);
    for (const key of failed) excluded[key] += 1;
    if (failed.length > 0) filteredOut.push({ id: profile.id, name: profile.name, priceFromKzt: profile.priceFromKzt, reasons: failed });
    return failed.length === 0;
  });
  filteredOut.sort(byId);
  const reasons = reasonText(locale, input, excluded);
  if (eligible.length === 0) {
    return { selected: [], result: { status: 'no_match', cards: [], candidatesBeforeCut: 0, notShown: filteredOut,
      message: `${noMatchMessage(locale, candidates.length)}${reasons}` } };
  }
  eligible.sort((left, right) => descriptionScore(right, input.eventType) - descriptionScore(left, input.eventType) || byId(left, right));
  const selected = eligible.slice(0, 3);
  const rankedLower: NotShownCandidate[] = eligible.slice(3)
    .map((profile): NotShownCandidate => ({ id: profile.id, name: profile.name, priceFromKzt: profile.priceFromKzt, reasons: ['rankedLower'] }));
  const cards: ContractorCard[] = selected.map(profile => ({
    id: profile.id, name: profile.name, category: input.category, city: profile.city,
    priceFromKzt: profile.priceFromKzt, explanation: templateExplanation(profile, input),
    dataFlags: [profile.synthetic ? 'synthetic' : null, profile.cityImputed ? 'cityImputed' : null, profile.priceImputed ? 'priceImputed' : null]
      .filter((value): value is ContractorCard['dataFlags'][number] => value !== null),
    kind: profile.kind,
    gender: profile.gender,
  }));
  return { selected, result: { status: 'found', cards, candidatesBeforeCut: eligible.length, notShown: [...rankedLower, ...filteredOut],
    message: `${foundMessage(locale, candidates.length, eligible.length, cards.length)}${reasons}` } };
}
