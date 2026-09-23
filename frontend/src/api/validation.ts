import type { CatalogOptions, ContractorCard, MatchResult } from '../../../shared/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');
}
function isCard(value: unknown): value is ContractorCard {
  if (!isRecord(value)) return false;
  return ['id', 'name', 'category', 'city', 'explanation'].every((key) => typeof value[key] === 'string')
    && typeof value.priceFromKzt === 'number' && Number.isFinite(value.priceFromKzt) && value.priceFromKzt >= 0
    && isStringList(value.dataFlags) && value.dataFlags.every((flag) => ['synthetic', 'cityImputed', 'priceImputed'].includes(flag))
    && (value.kind === 'person' || value.kind === 'place')
    && (value.gender === null || value.gender === 'female' || value.gender === 'male');
}
const NOT_SHOWN_REASONS = ['busy', 'budget', 'format', 'language', 'duration', 'rankedLower'];
function isNotShown(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string'
    && typeof value.priceFromKzt === 'number' && Number.isFinite(value.priceFromKzt)
    && isStringList(value.reasons) && value.reasons.length > 0 && value.reasons.every((reason) => NOT_SHOWN_REASONS.includes(reason));
}
export function isCatalogOptions(value: unknown): value is CatalogOptions {
  return isRecord(value) && isStringList(value.cities) && isStringList(value.categories)
    && isStringList(value.eventFormats) && isStringList(value.languages)
    && value.languages.every((language) => ['kz', 'ru', 'en'].includes(language));
}
export function isMatchResult(value: unknown): value is MatchResult {
  return isRecord(value) && ['found', 'no_category', 'no_match'].includes(String(value.status))
    && Array.isArray(value.cards) && value.cards.every(isCard) && typeof value.message === 'string'
    && typeof value.candidatesBeforeCut === 'number' && Number.isInteger(value.candidatesBeforeCut)
    && value.candidatesBeforeCut >= 0
    && Array.isArray(value.notShown) && value.notShown.every(isNotShown)
    && (value.status === 'found' ? value.cards.length > 0 : value.cards.length === 0);
}
export function isHealth(value: unknown): value is { status: 'up' } {
  return isRecord(value) && value.status === 'up';
}
