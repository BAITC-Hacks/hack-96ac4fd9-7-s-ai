import type { UiLocale } from '../lib/locale';

const RU = {
  invalid: 'Проверьте город, дату, формат, категорию и положительный бюджет. Длительность должна быть больше нуля.',
  intro: (price: string, budget: string, format: string) => 'Цена от ' + price + ' укладывается в бюджет ' + budget + '; формат «' + format + '» указан в профиле. ',
  language: (name: string) => 'язык — ' + name,
  duration: (hours: number, max: number) => 'длительность ' + hours + ' ч при лимите ' + max + ' ч',
  busy: (date: string) => 'занят(а) ' + date,
  expensive: (price: string) => 'цена от ' + price + ' выше бюджета',
  format: (name: string) => 'формат «' + name + '» не указан',
  missingLanguage: (name: string) => 'язык «' + name + '» не указан',
  maxHours: (hours: number) => 'максимальная длительность ' + hours + ' ч',
  noCategory: (city: string, category: string) => 'В городе «' + city + '» в каталоге нет подрядчиков категории «' + category + '». Попробуйте другой город или категорию.',
  all: (count: number) => 'Показаны все доступные варианты: ' + count + '. ',
  none: (count: number) => 'В городе и категории есть подрядчики: ' + count + ', но ни один не подошёл. ',
};

export const MOCK_COPY: Record<UiLocale, typeof RU> = {
  ru: RU,
  kk: {
    invalid: 'Қаланы, күнді, іс-шара түрін, санатты және оң бюджетті тексеріңіз. Ұзақтығы нөлден үлкен болуы керек.',
    intro: (price, budget, format) => 'Бастапқы бағасы ' + price + ', бұл ' + budget + ' бюджетіне сай; профильде «' + format + '» форматы көрсетілген. ',
    language: (name) => 'жұмыс тілі — ' + name,
    duration: (hours, max) => 'ұзақтығы ' + hours + ' сағ, профильдегі шегі — ' + max + ' сағ',
    busy: (date) => date + ' күні бос емес',
    expensive: (price) => 'бастапқы бағасы ' + price + ', бюджеттен жоғары',
    format: (name) => '«' + name + '» форматы көрсетілмеген',
    missingLanguage: (name) => '«' + name + '» тілі көрсетілмеген',
    maxHours: (hours) => 'ең ұзақ жұмыс уақыты — ' + hours + ' сағ',
    noCategory: (city, category) => 'Каталогта «' + city + '» қаласында «' + category + '» санатының мердігерлері жоқ. Басқа қаланы немесе санатты таңдаңыз.',
    all: (count) => 'Барлық қолжетімді нұсқалар көрсетілді: ' + count + '. ',
    none: (count) => 'Қалада осы санаттағы мердігерлер саны: ' + count + ', бірақ ешқайсысы сәйкес келмеді. ',
  },
  en: {
    invalid: 'Check the city, date, event type, category and positive budget. Duration must be greater than zero.',
    intro: (price, budget, format) => 'The starting price of ' + price + ' is within your ' + budget + ' budget; the profile lists the “' + format + '” format. ',
    language: (name) => 'working language: ' + name,
    duration: (hours, max) => 'duration: ' + hours + ' h within the ' + max + ' h limit',
    busy: (date) => 'unavailable on ' + date,
    expensive: (price) => 'starting price of ' + price + ' exceeds the budget',
    format: (name) => '“' + name + '” format is not listed',
    missingLanguage: (name) => '“' + name + '” language is not listed',
    maxHours: (hours) => 'maximum duration is ' + hours + ' h',
    noCategory: (city, category) => 'The catalogue has no contractors in the “' + category + '” category in ' + city + '. Try another city or category.',
    all: (count) => 'All available options are shown: ' + count + '. ',
    none: (count) => 'Contractors in this city and category: ' + count + ', but none meet the requirements. ',
  },
};

const PROFILES: Record<'kk' | 'en', Record<string, [string, string]>> = {
  kk: {
    'host-01': ['Жүргізуші Арман', 'Профильде екі тілдегі бөлімдері бар отбасылық үйлену тойларын жүргізетіні көрсетілген'],
    'host-02': ['Жүргізуші Әлия', 'Профильде интерактивті бағдарлама және халықаралық іс-шараларды жүргізу көрсетілген'],
    'host-03': ['Жүргізуші Данияр', 'Профильде шулы сайыстарсыз шағын үйлену тойына арналған бағдарлама көрсетілген'],
    'music-01': ['Скрипкашы Меруерт', 'Сипаттамада салтанат пен қонақтарды қарсы алуға арналған жанды скрипка музыкасы көрсетілген'],
    'photo-01': ['Фотограф Алексей', 'Сипаттамада репортаждық түсірілім және фотосуреттер топтамасын тапсыру көрсетілген'],
  },
  en: {
    'host-01': ['Host Arman', 'The profile describes family weddings with bilingual segments'],
    'host-02': ['Host Aliya', 'The profile lists an interactive programme and hosting international events'],
    'host-03': ['Host Daniyar', 'The profile describes an intimate wedding programme without loud contests'],
    'music-01': ['Violinist Meruert', 'The description lists live violin music for the ceremony and guest arrival'],
    'photo-01': ['Photographer Alexey', 'The description lists reportage photography and delivery of a photo collection'],
  },
};

export function mockProfileCopy(id: string, name: string, description: string, locale: UiLocale): [string, string] {
  return locale === 'ru' ? [name, description] : PROFILES[locale][id] ?? [name, description];
}
