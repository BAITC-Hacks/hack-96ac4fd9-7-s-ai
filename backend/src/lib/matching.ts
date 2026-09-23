import type { CreateMatchInput, MatchResult, ContractorCard } from '../../../shared/types.js';
import type { Catalog, Contractor } from './catalog.js';
import { templateExplanation } from './explanations.js';

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

export function selectMatches(catalog: Catalog, input: CreateMatchInput): { result: MatchResult; selected: Contractor[] } {
  const candidates = catalog.contractors.filter(profile => profile.city === input.city && profile.categories.includes(input.category));
  if (candidates.length === 0) {
    return { selected: [], result: { status: 'no_category', cards: [], candidatesBeforeCut: 0,
      message: `Берілген каталогта ${input.city} қаласында «${input.category}» санатындағы профиль жоқ.` } };
  }
  const excluded = { busy: 0, budget: 0, format: 0, language: 0, duration: 0 };
  const eligible = candidates.filter(profile => {
    const reasons = {
      busy: profile.busyDates.has(input.eventDate),
      budget: profile.priceFromKzt > input.budgetKzt,
      format: !profile.eventFormats.includes(input.eventType),
      language: input.language !== undefined && !profile.languages.includes(input.language),
      duration: input.durationHours !== undefined && profile.maxHours !== null && profile.maxHours < input.durationHours,
    };
    for (const key of Object.keys(reasons) as (keyof typeof reasons)[]) if (reasons[key]) excluded[key] += 1;
    return !Object.values(reasons).some(Boolean);
  });
  const reasons = [
    excluded.busy ? `${input.eventDate} күні бос емес: ${excluded.busy}` : '',
    excluded.budget ? `бастапқы бағасы бюджеттен жоғары: ${excluded.budget}` : '',
    excluded.format ? `«${input.eventType}» форматын қабылдамайды: ${excluded.format}` : '',
    excluded.language ? `сұралған тіл сәйкес емес: ${excluded.language}` : '',
    excluded.duration ? `сұралған ұзақтыққа жетпейді: ${excluded.duration}` : '',
  ].filter(Boolean).join('; ');
  const reasonText = reasons ? ` Өтпеу себептері: ${reasons}. Бір профильде бірнеше себеп қабаттасуы мүмкін.` : '';
  if (eligible.length === 0) {
    return { selected: [], result: { status: 'no_match', cards: [], candidatesBeforeCut: 0,
      message: `Қала мен санатта ${candidates.length} профиль бар, бірақ шарттардың бәріне сәйкес ешкім жоқ.${reasonText}` } };
  }
  eligible.sort((left, right) => descriptionScore(right, input.eventType) - descriptionScore(left, input.eventType)
    || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  const selected = eligible.slice(0, 3);
  const cards: ContractorCard[] = selected.map(profile => ({
    id: profile.id, name: profile.name, category: input.category, city: profile.city,
    priceFromKzt: profile.priceFromKzt, explanation: templateExplanation(profile, input),
    dataFlags: [profile.synthetic ? 'synthetic' : null, profile.cityImputed ? 'cityImputed' : null, profile.priceImputed ? 'priceImputed' : null]
      .filter((value): value is ContractorCard['dataFlags'][number] => value !== null),
  }));
  return { selected, result: { status: 'found', cards, candidatesBeforeCut: eligible.length,
    message: `${candidates.length} кандидаттың ${eligible.length}-і шарттардан өтті; ${cards.length} карточка көрсетілді.${reasonText}` } };
}
