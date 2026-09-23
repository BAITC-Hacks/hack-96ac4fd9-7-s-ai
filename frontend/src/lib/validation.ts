import type { CatalogOptions, CreateMatchInput, Language } from '../../../shared/types';

export function validateInput(input: CreateMatchInput, catalog: CatalogOptions): string | null {
  if (!catalog.cities.includes(input.city) || !catalog.categories.includes(input.category)
    || !catalog.eventFormats.includes(input.eventType)) return 'Выберите город, формат и категорию из каталога.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) || !Number.isFinite(Date.parse(input.eventDate))
    || new Date(input.eventDate).toISOString().slice(0, 10) !== input.eventDate) return 'Укажите действительную дату мероприятия.';
  if (!Number.isFinite(input.budgetKzt) || input.budgetKzt <= 0) return 'Бюджет должен быть больше нуля.';
  if (input.durationHours !== undefined && (!Number.isFinite(input.durationHours) || input.durationHours <= 0))
    return 'Длительность должна быть больше нуля.';
  if (input.language && !catalog.languages.includes(input.language)) return 'Выберите язык из каталога.';
  return null;
}

export function readForm(form: HTMLFormElement): CreateMatchInput {
  const data = new FormData(form);
  const language = String(data.get('language') ?? '');
  const duration = String(data.get('durationHours') ?? '');
  return {
    city: String(data.get('city') ?? ''),
    eventDate: String(data.get('eventDate') ?? ''),
    eventType: String(data.get('eventType') ?? ''),
    category: String(data.get('category') ?? ''),
    budgetKzt: Number(data.get('budgetKzt')),
    ...(duration ? { durationHours: Number(duration) } : {}),
    ...(language ? { language: language as Language } : {}),
  };
}
