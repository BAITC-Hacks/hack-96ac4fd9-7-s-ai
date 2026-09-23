import { z } from 'zod';
import type { CreateMatchInput, CatalogOptions } from '../../../shared/types.js';
import { isCalendarDate, MIN_EVENT_DATE, MAX_EVENT_DATE } from './catalog.js';

export function createMatchSchema(options: CatalogOptions): z.ZodType<CreateMatchInput> {
  const known = (values: string[], message: string) => z.string().trim().min(1).refine(value => values.includes(value), message);
  return z.object({
    city: known(options.cities, 'Қаланы catalog-options тізімінен таңдаңыз.'),
    eventDate: z.string().refine(isCalendarDate, 'Күн YYYY-MM-DD пішімінде нақты күн болуы керек.')
      .refine(day => day >= MIN_EVENT_DATE && day <= MAX_EVENT_DATE, `Күн ${MIN_EVENT_DATE}–${MAX_EVENT_DATE} аралығында болуы керек.`),
    eventType: known(options.eventFormats, 'Іс-шара форматын catalog-options тізімінен таңдаңыз.'),
    category: known(options.categories, 'Санатты catalog-options тізімінен таңдаңыз.'),
    budgetKzt: z.number().finite().int().positive().max(Number.MAX_SAFE_INTEGER),
    durationHours: z.number().finite().positive().optional(),
    language: z.enum(['ru', 'kz', 'en']).optional(),
    locale: z.enum(['ru', 'kz', 'en']).optional(),
  }).strict().transform(({ durationHours, language, locale, ...required }) => ({
    ...required,
    ...(durationHours === undefined ? {} : { durationHours }),
    ...(language === undefined ? {} : { language }),
    ...(locale === undefined ? {} : { locale }),
  }));
}
