import type { ApiResponse, CatalogOptions, ContractorCard, CreateMatchInput, Language, MatchResult } from '../../../shared/types';

type MockProfile = Omit<ContractorCard, 'explanation'> & {
  eventFormats: string[];
  languages: Language[];
  maxHours: number;
  busyDates: string[];
  description: string;
};

const PROFILES: MockProfile[] = [
  { id: 'host-01', name: 'Ведущий Арман', city: 'Алматы', category: 'Ведущий', priceFromKzt: 120000,
    dataFlags: ['synthetic'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['kz', 'ru'], maxHours: 6,
    busyDates: ['2026-11-15', '2026-11-16'], description: 'В профиле указано проведение семейных свадеб с двуязычными блоками' },
  { id: 'host-02', name: 'Ведущая Алия', city: 'Алматы', category: 'Ведущий', priceFromKzt: 150000,
    dataFlags: ['synthetic', 'cityImputed'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['kz', 'ru', 'en'], maxHours: 8,
    busyDates: ['2026-11-15', '2026-11-16'], description: 'В профиле есть интерактивная программа и ведение международных мероприятий' },
  { id: 'host-03', name: 'Ведущий Данияр', city: 'Алматы', category: 'Ведущий', priceFromKzt: 100000,
    dataFlags: ['synthetic', 'priceImputed'], eventFormats: ['Свадьба'], languages: ['kz', 'ru'], maxHours: 4,
    busyDates: ['2026-11-16'], description: 'В профиле указана камерная свадебная программа без громких конкурсов' },
  { id: 'music-01', name: 'Скрипачка Меруерт', city: 'Алматы', category: 'Скрипач', priceFromKzt: 80000,
    dataFlags: ['synthetic'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['kz', 'ru'], maxHours: 2,
    busyDates: ['2026-11-16'], description: 'В описании есть живая скрипка для церемонии и встречи гостей' },
  { id: 'photo-01', name: 'Фотограф Алексей', city: 'Астана', category: 'Фотограф', priceFromKzt: 90000,
    dataFlags: ['synthetic'], eventFormats: ['Свадьба', 'Корпоратив'], languages: ['ru', 'en'], maxHours: 5,
    busyDates: [], description: 'В описании указана репортажная съёмка и передача серии фотографий' },
];

export const MOCK_CATALOG: CatalogOptions = {
  cities: [...new Set(PROFILES.map((profile) => profile.city))],
  categories: [...new Set(PROFILES.map((profile) => profile.category))],
  eventFormats: [...new Set(PROFILES.flatMap((profile) => profile.eventFormats))],
  languages: [...new Set(PROFILES.flatMap((profile) => profile.languages))],
};

const LANGUAGE_NAMES: Record<Language, string> = { kz: 'казахский', ru: 'русский', en: 'английский' };
const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';

function explain(profile: MockProfile, input: CreateMatchInput): string {
  const details = [
    input.language ? 'язык — ' + LANGUAGE_NAMES[input.language] : '',
    input.durationHours ? 'длительность ' + input.durationHours + ' ч при лимите ' + profile.maxHours + ' ч' : '',
  ].filter(Boolean);
  return 'Цена от ' + money(profile.priceFromKzt) + ' укладывается в бюджет ' + money(input.budgetKzt)
    + '; формат «' + input.eventType + '» указан в профиле. '
    + profile.description + (details.length ? '; ' + details.join(', ') : '') + '.';
}

export function mockCreateMatch(input: CreateMatchInput): ApiResponse<MatchResult> {
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)
    && Number.isFinite(Date.parse(input.eventDate))
    && new Date(input.eventDate).toISOString().slice(0, 10) === input.eventDate;
  if (!MOCK_CATALOG.cities.includes(input.city) || !MOCK_CATALOG.categories.includes(input.category)
    || !MOCK_CATALOG.eventFormats.includes(input.eventType) || !validDate
    || !Number.isFinite(input.budgetKzt) || input.budgetKzt <= 0
    || (input.durationHours !== undefined && (!Number.isFinite(input.durationHours) || input.durationHours <= 0))
    || (input.language !== undefined && !MOCK_CATALOG.languages.includes(input.language))) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Проверьте город, дату, формат, категорию и положительный бюджет. Длительность должна быть больше нуля.' } };
  }
  const candidates = PROFILES.filter((profile) => profile.city === input.city && profile.category === input.category);
  if (!candidates.length) return { ok: true, data: {
    status: 'no_category', cards: [], candidatesBeforeCut: 0,
    message: 'В городе «' + input.city + '» в каталоге нет подрядчиков категории «' + input.category + '». Попробуйте другой город или категорию.',
  } };
  const reasons: string[] = [];
  const matched = candidates.filter((profile) => {
    const excluded: string[] = [];
    if (profile.busyDates.includes(input.eventDate)) excluded.push('занят(а) ' + input.eventDate);
    if (profile.priceFromKzt > input.budgetKzt) excluded.push('цена от ' + money(profile.priceFromKzt) + ' выше бюджета');
    if (!profile.eventFormats.includes(input.eventType)) excluded.push('формат «' + input.eventType + '» не указан');
    if (input.language && !profile.languages.includes(input.language)) excluded.push('язык «' + LANGUAGE_NAMES[input.language] + '» не указан');
    if (input.durationHours && input.durationHours > profile.maxHours) excluded.push('максимальная длительность ' + profile.maxHours + ' ч');
    if (excluded.length) reasons.push(profile.name + ': ' + excluded.join('; ') + '.');
    return !excluded.length;
  }).sort((a, b) => a.id.localeCompare(b.id));
  return { ok: true, data: {
    status: matched.length ? 'found' : 'no_match',
    cards: matched.slice(0, 3).map((profile) => ({
      id: profile.id, name: profile.name, category: profile.category, city: profile.city,
      priceFromKzt: profile.priceFromKzt, dataFlags: [...profile.dataFlags], explanation: explain(profile, input),
    })),
    candidatesBeforeCut: matched.length,
    message: matched.length
      ? (matched.length < 3 ? 'Показаны все доступные варианты: ' + matched.length + '. ' : '') + reasons.join(' ')
      : 'В городе и категории есть подрядчики: ' + candidates.length + ', но ни один не подошёл. ' + reasons.join(' '),
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
