import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import type { CatalogOptions, Language } from '../../../shared/types.js';
import type { Gender } from './gender.js';
import { withDisplayNames } from './displayNames.js';

export const MIN_EVENT_DATE = '2026-09-23';
export const MAX_EVENT_DATE = '2026-12-31';
export const DATASET_PATH = new URL('../../data/contractors.csv', import.meta.url);

export interface Contractor {
  id: string;
  /** Kazakh display name (the dataset's invented names are replaced, see displayNames.ts). */
  name: string;
  kind: 'person' | 'place';
  gender: Gender | null;
  categories: string[];
  city: string;
  priceFromKzt: number;
  eventFormats: string[];
  languages: Language[];
  maxHours: number | null;
  busyDates: ReadonlySet<string>;
  description: string;
  synthetic: boolean;
  cityImputed: boolean;
  priceImputed: boolean;
}

export interface Catalog {
  contractors: readonly Contractor[];
  options: CatalogOptions;
  version: string;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const nonempty = z.string().trim().min(1);
const flag = z.enum(['True', 'False']).transform(value => value === 'True');
const positiveNumber = z.string().trim().regex(/^\d+(?:\.\d+)?$/).transform(Number).pipe(z.number().finite().positive());
const rowSchema = z.object({
  id: nonempty, anon_name: nonempty, categories: nonempty, city: nonempty,
  price_from_kzt: positiveNumber.pipe(z.number().int().max(Number.MAX_SAFE_INTEGER)),
  event_formats: nonempty, languages: nonempty,
  max_hours: z.union([z.literal(''), z.literal('null'), positiveNumber]).transform(value => value === '' || value === 'null' ? null : value),
  busy_dates: z.string(), description: nonempty,
  synthetic: flag, city_imputed: flag, price_imputed: flag,
});
const LANGUAGE_MAP: Record<string, Language> = { русский: 'ru', казахский: 'kz', английский: 'en' };
const splitList = (value: string) => [...new Set(value.split('|').map(item => item.trim().normalize('NFC')).filter(Boolean))];
const uniqueSorted = (values: string[]) => [...new Set(values)].sort();

export function parseCatalog(csv: string): Catalog {
  const raw: unknown = parse(csv, { columns: true, bom: true, skip_empty_lines: true, trim: true });
  const rows = z.array(rowSchema).min(1).parse(raw);
  const seenIds = new Set<string>();
  const parsed: Omit<Contractor, 'kind' | 'gender'>[] = rows.map(row => {
    if (seenIds.has(row.id)) throw new Error(`Duplicate contractor ID: ${row.id}`);
    seenIds.add(row.id);
    const busyDates = splitList(row.busy_dates);
    if (busyDates.some(day => !isCalendarDate(day) || day < MIN_EVENT_DATE || day > MAX_EVENT_DATE)) {
      throw new Error(`Invalid availability date for contractor ${row.id}`);
    }
    const languages = splitList(row.languages).map(value => {
      const language = LANGUAGE_MAP[value];
      if (!language) throw new Error(`Unknown dataset language for contractor ${row.id}`);
      return language;
    });
    return { id: row.id, name: row.anon_name, categories: splitList(row.categories), city: row.city.normalize('NFC'),
      priceFromKzt: row.price_from_kzt, eventFormats: splitList(row.event_formats), languages,
      maxHours: row.max_hours, busyDates: new Set(busyDates), description: row.description,
      synthetic: row.synthetic, cityImputed: row.city_imputed, priceImputed: row.price_imputed };
  });
  const contractors = withDisplayNames(parsed);
  return {
    contractors,
    options: {
      cities: uniqueSorted(contractors.map(item => item.city)),
      categories: uniqueSorted(contractors.flatMap(item => item.categories)),
      eventFormats: uniqueSorted(contractors.flatMap(item => item.eventFormats)),
      languages: [...new Set(contractors.flatMap(item => item.languages))].sort(),
    },
    version: createHash('sha256').update(csv).digest('hex'),
  };
}

export function loadCatalog(path: string | URL = DATASET_PATH): Catalog {
  return parseCatalog(readFileSync(path, 'utf8'));
}
