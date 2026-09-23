// SINGLE SOURCE OF TRUTH for data shapes shared by frontend and backend.
// Edit only together, and keep in sync with shared/api.md.
// Only `type` declarations here: no runtime code, no imports.

export type ErrorCode = 'VALIDATION' | 'AI_FAILED' | 'NOT_FOUND' | 'INTERNAL';

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string } };

// ---- Domain: умный подбор подрядчиков ----

export type MatchStatus = 'found' | 'no_category' | 'no_match';

export type Language = 'ru' | 'kz' | 'en';

export interface CreateMatchInput {
  city: string; // из CatalogOptions.cities
  eventDate: string; // ISO "2026-11-14"
  eventType: string; // из CatalogOptions.eventFormats
  category: string; // из CatalogOptions.categories
  budgetKzt: number; // жоғарғы шек, сапа сигналы емес
  durationHours?: number;
  language?: Language;
}

export interface ContractorCard {
  id: string;
  name: string; // anon_name
  category: string;
  city: string;
  priceFromKzt: number;
  explanation: string; // 1-2 сөйлем, нақты параметрлерге негізделген
  dataFlags: ('synthetic' | 'cityImputed' | 'priceImputed')[];
}

export interface MatchResult {
  status: MatchStatus;
  cards: ContractorCard[]; // 0-3
  message: string; // no_category/no_match себебі, немесе 3-тен аз болғанда түсіндірме
  candidatesBeforeCut: number; // қатаң сүзгіден өткен саны (карточкаға дейін)
}

export interface CatalogOptions {
  cities: string[];
  categories: string[];
  eventFormats: string[];
  languages: Language[];
}
