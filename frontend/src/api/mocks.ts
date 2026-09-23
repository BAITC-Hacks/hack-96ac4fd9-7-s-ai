import type { ApiResponse, CatalogOptions, ContractorCard, CreateMatchInput, Language, MatchResult, NotShownCandidate, NotShownReason } from '../../../shared/types';
import type { UiLocale } from '../lib/locale';
import { MOCK_COPY, mockProfileCopy } from './mockCopy.ts';
import { catalogLabel, languageLabel } from '../lib/catalogLabels.ts';
import { formatMoney as money } from '../lib/format.ts';

type MockProfile = Omit<ContractorCard, 'explanation' | 'kind'> & {
  eventFormats: string[];
  languages: Language[];
  maxHours: number;
  busyDates: string[];
  description: string;
};

const PROFILES: MockProfile[] = [
  { id: 'host-01', gender: 'male', name: 'Ведущий Арман', city: 'Алматы', category: 'Ведущий', priceFromKzt: 120000,
    dataFlags: ['synthetic'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['kz', 'ru'], maxHours: 6,
    busyDates: ['2026-11-15', '2026-11-16'], description: 'В профиле указано проведение семейных свадеб с двуязычными блоками' },
  { id: 'host-02', gender: 'female', name: 'Ведущая Алия', city: 'Алматы', category: 'Ведущий', priceFromKzt: 150000,
    dataFlags: ['synthetic', 'cityImputed'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['kz', 'ru', 'en'], maxHours: 8,
    busyDates: ['2026-11-15', '2026-11-16'], description: 'В профиле есть интерактивная программа и ведение международных мероприятий' },
  { id: 'host-03', gender: 'male', name: 'Ведущий Данияр', city: 'Алматы', category: 'Ведущий', priceFromKzt: 100000,
    dataFlags: ['synthetic', 'priceImputed'], eventFormats: ['Свадьба'], languages: ['kz', 'ru'], maxHours: 4,
    busyDates: ['2026-11-16'], description: 'В профиле указана камерная свадебная программа без громких конкурсов' },
  { id: 'music-01', gender: 'female', name: 'Скрипачка Меруерт', city: 'Алматы', category: 'Скрипач', priceFromKzt: 80000,
    dataFlags: ['synthetic'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['kz', 'ru'], maxHours: 2,
    busyDates: ['2026-11-16'], description: 'В описании есть живая скрипка для церемонии и встречи гостей' },
  { id: 'photo-01', gender: 'male', name: 'Фотограф Алексей', city: 'Астана', category: 'Фотограф', priceFromKzt: 90000,
    dataFlags: ['synthetic'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['ru', 'en'], maxHours: 5,
    busyDates: [], description: 'В описании указана репортажная съёмка и передача серии фотографий' },
];

export const MOCK_CATALOG: CatalogOptions = {
  cities: [...new Set(PROFILES.map((profile) => profile.city))],
  categories: [...new Set(PROFILES.map((profile) => profile.category))],
  eventFormats: [...new Set(PROFILES.flatMap((profile) => profile.eventFormats))],
  languages: [...new Set(PROFILES.flatMap((profile) => profile.languages))],
};

function explain(profile: MockProfile, input: CreateMatchInput, locale: UiLocale): string {
  const copy = MOCK_COPY[locale];
  const details = [
    input.language ? copy.language(languageLabel(input.language, locale)) : '',
    input.durationHours ? copy.duration(input.durationHours, profile.maxHours) : '',
  ].filter(Boolean);
  return copy.intro(money(profile.priceFromKzt, locale), money(input.budgetKzt, locale), catalogLabel(input.eventType, locale))
    + mockProfileCopy(profile.id, profile.name, profile.description, locale)[1]
    + (details.length ? '; ' + details.join(', ') : '') + '.';
}

export function mockCreateMatch(input: CreateMatchInput, locale: UiLocale = 'ru'): ApiResponse<MatchResult> {
  const copy = MOCK_COPY[locale];
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)
    && Number.isFinite(Date.parse(input.eventDate))
    && new Date(input.eventDate).toISOString().slice(0, 10) === input.eventDate;
  if (!MOCK_CATALOG.cities.includes(input.city) || !MOCK_CATALOG.categories.includes(input.category)
    || !MOCK_CATALOG.eventFormats.includes(input.eventType) || !validDate
    || !Number.isFinite(input.budgetKzt) || input.budgetKzt <= 0
    || (input.durationHours !== undefined && (!Number.isFinite(input.durationHours) || input.durationHours <= 0))
    || (input.language !== undefined && !MOCK_CATALOG.languages.includes(input.language))) {
    return { ok: false, error: { code: 'VALIDATION', message: copy.invalid } };
  }
  const candidates = PROFILES.filter((profile) => profile.city === input.city && profile.category === input.category);
  if (!candidates.length) return { ok: true, data: {
    status: 'no_category', cards: [], candidatesBeforeCut: 0, notShown: [],
    message: copy.noCategory(catalogLabel(input.city, locale), catalogLabel(input.category, locale)),
  } };
  const reasons: string[] = [];
  const filteredOut: NotShownCandidate[] = [];
  const matched = candidates.filter((profile) => {
    const excluded: string[] = [];
    const codes: NotShownReason[] = [];
    if (profile.busyDates.includes(input.eventDate)) { excluded.push(copy.busy(input.eventDate)); codes.push('busy'); }
    if (profile.priceFromKzt > input.budgetKzt) { excluded.push(copy.expensive(money(profile.priceFromKzt, locale))); codes.push('budget'); }
    if (!profile.eventFormats.includes(input.eventType)) { excluded.push(copy.format(catalogLabel(input.eventType, locale))); codes.push('format'); }
    if (input.language && !profile.languages.includes(input.language)) { excluded.push(copy.missingLanguage(languageLabel(input.language, locale))); codes.push('language'); }
    if (input.durationHours && input.durationHours > profile.maxHours) { excluded.push(copy.maxHours(profile.maxHours)); codes.push('duration'); }
    const name = mockProfileCopy(profile.id, profile.name, profile.description, locale)[0];
    if (excluded.length) {
      reasons.push(name + ': ' + excluded.join('; ') + '.');
      filteredOut.push({ id: profile.id, name, priceFromKzt: profile.priceFromKzt, reasons: codes });
    }
    return !excluded.length;
  }).sort((a, b) => a.id.localeCompare(b.id));
  const rankedLower = matched.slice(3).map((profile): NotShownCandidate => ({ id: profile.id,
    name: mockProfileCopy(profile.id, profile.name, profile.description, locale)[0], priceFromKzt: profile.priceFromKzt, reasons: ['rankedLower'] }));
  return { ok: true, data: {
    status: matched.length ? 'found' : 'no_match',
    cards: matched.slice(0, 3).map((profile) => ({
      id: profile.id, name: mockProfileCopy(profile.id, profile.name, profile.description, locale)[0], category: profile.category, city: profile.city,
      priceFromKzt: profile.priceFromKzt, dataFlags: [...profile.dataFlags], explanation: explain(profile, input, locale), kind: 'person', gender: profile.gender,
    })),
    candidatesBeforeCut: matched.length,
    notShown: [...rankedLower, ...filteredOut],
    message: matched.length
      ? (matched.length < 3 ? copy.all(matched.length) : '') + reasons.join(' ')
      : copy.none(candidates.length) + reasons.join(' '),
  } };
}

export const DEMO_INPUT: CreateMatchInput = {
  city: 'Алматы', eventDate: '2026-11-14', eventType: 'Свадьба', category: 'Ведущий', budgetKzt: 200000,
};

function fixture(input: CreateMatchInput): MatchResult {
  const response = mockCreateMatch(input);
  if (!response.ok) throw new Error(response.error.message);
  return response.data;
}

export const FOUND_FIXTURE = fixture(DEMO_INPUT);
export const NO_CATEGORY_FIXTURE = fixture({ ...DEMO_INPUT, city: 'Астана' });
export const NO_MATCH_FIXTURE = fixture({ ...DEMO_INPUT, eventDate: '2026-11-16' });
