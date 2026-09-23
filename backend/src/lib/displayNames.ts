import type { Contractor } from './catalog.js';
import { genderHint, type Gender } from './gender.js';

// The dataset's names are invented (anime characters). They are replaced by invented Kazakh names that are
// deterministic per ID and unique within the catalogue; the description is updated so quotes stay consistent.

const PERSON_CATEGORIES = new Set(['Ведущий', 'Ведущий церемонии', 'Фотограф', 'Видеограф', 'Флорист', 'Декоратор', 'Инструменталист']);

const FIRST_NAMES: Record<Gender, string[]> = {
  male: ['Нұрлан', 'Айбек', 'Ерлан', 'Данияр', 'Асхат', 'Бауыржан', 'Ержан', 'Нұржан', 'Талғат', 'Арман', 'Мирас', 'Әлихан', 'Дәурен',
    'Санжар', 'Ернар', 'Бекзат', 'Азамат', 'Олжас', 'Темірлан', 'Жандос', 'Қайрат', 'Ербол', 'Ақжол', 'Мұхтар', 'Самат'],
  female: ['Айгерім', 'Әсел', 'Мадина', 'Жанар', 'Гүлнар', 'Айдана', 'Динара', 'Балжан', 'Сәуле', 'Назерке', 'Жұлдыз', 'Аружан',
    'Томирис', 'Меруерт', 'Ақмарал', 'Айжан', 'Гүлжан', 'Индира', 'Камила', 'Салтанат', 'Дана', 'Мөлдір', 'Ақбота', 'Інжу', 'Әйгерім'],
};
const SURNAMES: [male: string, female: string][] = [
  ['Серіков', 'Серікова'], ['Омаров', 'Омарова'], ['Қасымов', 'Қасымова'], ['Жұмабаев', 'Жұмабаева'], ['Нұрланов', 'Нұрланова'],
  ['Сейітов', 'Сейітова'], ['Бекенов', 'Бекенова'], ['Тоқтаров', 'Тоқтарова'], ['Ахметов', 'Ахметова'], ['Сәрсенов', 'Сәрсенова'],
  ['Есенов', 'Есенова'], ['Байжанов', 'Байжанова'], ['Құрманов', 'Құрманова'], ['Мұратов', 'Мұратова'], ['Әбенов', 'Әбенова'],
  ['Исаев', 'Исаева'], ['Төлегенов', 'Төлегенова'], ['Жақыпов', 'Жақыпова'], ['Оспанов', 'Оспанова'], ['Иманов', 'Иманова'],
];
/** Venue / group / shop names, chosen by the profile's first category. */
const PLACE_NAMES: [categories: string[], names: string[]][] = [
  [['Банкетный зал', 'Ресторан', 'Отель', 'Загородная площадка'],
    ['Ақ Сарай', 'Алтын Орда', 'Шаңырақ', 'Бәйтерек', 'Көк Тау', 'Нұр Сарай', 'Аққу', 'Ақ Орда', 'Алатау', 'Ұлытау', 'Тұмар', 'Қазына']],
  [['Лайв-бэнд', 'Национальный ансамбль', 'Танцевальный коллектив', 'Шоу-программа'],
    ['Сазген', 'Дала Сазы', 'Көктем', 'Думан', 'Арна', 'Самал', 'Шабыт', 'Керуен', 'Сарын', 'Толқын', 'Әуен', 'Көкжиек']],
  [['Фото и видеобудки'], ['Сәт', 'Естелік', 'Жарқыл', 'Кадр', 'Көрініс']],
  [['Подарки и сувениры'], ['Тартуым', 'Сыйлық Үйі', 'Қолөнер', 'Базарлық', 'Ырыс']],
];

export const isPersonProfile = (categories: string[]) => categories.every((category) => PERSON_CATEGORIES.has(category));

// FNV-1a: a tiny stable hash so the same ID always gets the same name and gender.
export function stableHash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Replaces whole, capitalised occurrences only — so «Нами» is replaced but the pronoun «нами» is not. */
function replaceWord(text: string, from: string, to: string): string {
  if (!from) return text;
  const pattern = (word: string) => new RegExp(`(?<!\\p{L})${escape(word)}(?!\\p{L})`, 'gu');
  return text.replace(pattern(from), to).replace(pattern(from.toLocaleUpperCase('ru')), to.toLocaleUpperCase('kk'));
}

export function renameDescription(description: string, oldName: string, newName: string): string {
  const oldParts = oldName.split(/\s+/).filter((part) => part.length >= 3);
  const newParts = newName.split(/\s+/);
  let text = replaceWord(description, oldName, newName);
  oldParts.forEach((part, index) => {
    // First name ↔ first name, surname ↔ surname; single-word names map to the whole new name.
    const target = oldParts.length === 1 ? newName : newParts[Math.min(index, newParts.length - 1)] ?? newName;
    text = replaceWord(text, part, target);
  });
  return text;
}

export function withDisplayNames(contractors: readonly Omit<Contractor, 'kind' | 'gender'>[]): Contractor[] {
  const used = new Set<string>();
  const usedFirst = new Set<string>();
  const assigned = new Map<string, Pick<Contractor, 'name' | 'kind' | 'gender'>>();
  for (const profile of [...contractors].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))) {
    const person = isPersonProfile(profile.categories);
    const gender: Gender | null = person ? genderHint(profile.description) ?? (stableHash(profile.id) % 2 === 0 ? 'male' : 'female') : null;
    const pool = PLACE_NAMES.find(([categories]) => categories.includes(profile.categories[0] ?? ''))?.[1] ?? PLACE_NAMES[0]![1];
    let name = '';
    let first = '';
    // Prefer an unused first name while the pool lasts; the full name is always unique.
    const acceptable = (attempt: number) => name && !used.has(name) && (!first || attempt >= 200 || !usedFirst.has(first));
    for (let attempt = 0; !acceptable(attempt - 1); attempt++) {
      const hash = stableHash(`${profile.id}#${attempt}`);
      if (gender) {
        first = FIRST_NAMES[gender][hash % FIRST_NAMES[gender].length]!;
        const [male, female] = SURNAMES[(hash >>> 8) % SURNAMES.length]!;
        name = `${first} ${gender === 'male' ? male : female}`;
      } else {
        name = pool[(hash + attempt) % pool.length]!;
      }
      if (attempt > 1000) throw new Error(`Could not assign a unique display name for ${profile.id}`);
    }
    used.add(name);
    if (first) usedFirst.add(first);
    assigned.set(profile.id, { name, kind: person ? 'person' : 'place', gender });
  }
  return contractors.map((profile) => {
    const display = assigned.get(profile.id)!;
    return { ...profile, ...display, description: renameDescription(profile.description, profile.name, display.name) };
  });
}
