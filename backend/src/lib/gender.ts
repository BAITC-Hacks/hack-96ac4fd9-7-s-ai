export type Gender = 'female' | 'male';

// Russian self-descriptions mark gender grammatically; only explicit markers count, nothing is guessed.
const FEMALE = new Set(['она', 'ведущая', 'провела', 'сделала', 'работала', 'окончила', 'закончила', 'сама', 'готова', 'уверена',
  'рада', 'счастлива', 'певица', 'танцовщица', 'скрипачка', 'пианистка', 'исполнительница', 'артистка', 'создала', 'начала',
  'стала', 'благодарна', 'флористка']);
const MALE = new Set(['он', 'ведущий', 'провел', 'сделал', 'работал', 'окончил', 'закончил', 'сам', 'готов', 'уверен', 'рад',
  'счастлив', 'певец', 'танцор', 'скрипач', 'пианист', 'исполнитель', 'артист', 'создал', 'начал', 'стал', 'благодарен']);

export function genderHint(description: string): Gender | null {
  const words = description.toLowerCase().replaceAll('ё', 'е').match(/\p{L}+/gu) ?? [];
  const female = words.some((word) => FEMALE.has(word));
  const male = words.some((word) => MALE.has(word));
  return female === male ? null : female ? 'female' : 'male';
}
