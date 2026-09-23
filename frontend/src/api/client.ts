import type { ApiResponse, CatalogOptions, CreateMatchInput, MatchResult } from '../../../shared/types';
import { isCatalogOptions, isHealth, isMatchResult } from './validation';
import type { UiLocale } from '../lib/locale';
import { MOCK_CATALOG, mockCreateMatch } from './mocks';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const REQUEST_TIMEOUT_MS = 15000;

async function request<T>(path: string, validate: (value: unknown) => value is T, input?: CreateMatchInput): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api' + path, {
      method: input ? 'POST' : 'GET',
      headers: input ? { 'Content-Type': 'application/json' } : undefined,
      body: input ? JSON.stringify(input) : undefined,
      signal: controller.signal,
    });
    const payload: ApiResponse<T> = await response.json().catch(() => {
      throw new Error('Сервис прислал некорректный ответ. Попробуйте ещё раз.');
    });
    if (!payload || typeof payload.ok !== 'boolean' || (payload.ok ? !validate(payload.data) : typeof payload.error?.message !== 'string')) {
      throw new Error('Некорректный ответ сервиса.');
    }
    if (!response.ok && payload.ok) throw new Error('Сервис временно недоступен. Попробуйте ещё раз.');
    return payload;
  } catch (error) {
    return { ok: false, error: { code: 'INTERNAL', message: controller.signal.aborted
      ? 'Сервис не ответил за 15 секунд. Попробуйте ещё раз.'
      : error instanceof Error && error.message !== 'Failed to fetch'
        ? error.message : 'Не удалось связаться с сервисом. Проверьте подключение и повторите запрос.' } };
  } finally {
    clearTimeout(timeout);
  }
}

async function mockDelay() {
  await new Promise<void>((resolve) => setTimeout(resolve, 350));
}

export async function getHealth(): Promise<ApiResponse<{ status: 'up' }>> {
  if (!USE_MOCKS) return request('/health', isHealth);
  return { ok: true, data: { status: 'up' } };
}

export async function getCatalogOptions(): Promise<ApiResponse<CatalogOptions>> {
  if (!USE_MOCKS) return request('/catalog-options', isCatalogOptions);
  await mockDelay();
  return { ok: true, data: MOCK_CATALOG };
}

export async function createMatch(input: CreateMatchInput): Promise<ApiResponse<MatchResult>> {
  if (!USE_MOCKS) return request('/match', isMatchResult, input);
  await mockDelay();
  return mockCreateMatch(input);
}

// Local presentation only. No extra HTTP requests or changes to CreateMatchInput.
export function localizeMatchResult(result: MatchResult, input: CreateMatchInput, locale: UiLocale): MatchResult {
  if (!USE_MOCKS) return result;
  const localized = mockCreateMatch(input, locale);
  return localized.ok ? localized.data : result;
}
