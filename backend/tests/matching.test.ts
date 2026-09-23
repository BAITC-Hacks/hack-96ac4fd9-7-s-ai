import test from 'node:test';
import assert from 'node:assert/strict';
import type { CreateMatchInput } from '../../shared/types.js';
import { loadCatalog, type Contractor, type Catalog } from '../src/lib/catalog.js';
import { selectMatches } from '../src/lib/matching.js';
import { createMatchSchema } from '../src/lib/validation.js';

const catalog = loadCatalog();
const query: CreateMatchInput = { city: 'Алматы', category: 'Ведущий', eventType: 'корпоратив', eventDate: '2026-10-06', budgetKzt: 1000000, language: 'ru', durationHours: 5 };
const ids = (input: CreateMatchInput) => selectMatches(catalog, input).result.cards.map(card => card.id);

test('dense category: true count before cut, stable order and distinct factual explanations', () => {
  const first = selectMatches(catalog, query).result;
  assert.equal(first.status, 'found');
  assert.equal(first.candidatesBeforeCut, 6);
  assert.deepEqual(first.cards.map(card => card.id), ['HK-44733', 'HK-88430', 'HK-35215']);
  assert.deepEqual(first, selectMatches(catalog, query).result);
  assert.equal(new Set(first.cards.map(card => card.explanation)).size, 3);
  const withoutNames = first.cards.map(card => catalog.contractors.reduce((text, profile) => text.replaceAll(profile.name, ''), card.explanation));
  assert.equal(new Set(withoutNames).size, 3);
  for (const card of first.cards) {
    const profile = catalog.contractors.find(item => item.id === card.id)!;
    assert.ok(profile.priceFromKzt <= query.budgetKzt);
    assert.equal(profile.busyDates.has(query.eventDate), false);
    assert.ok(card.explanation.includes('Профильдегі дерек'));
    assert.ok(card.explanation.includes(query.eventDate));
    assert.doesNotMatch(card.explanation, /топ[-\s]?\d|идеаль|безупреч/iu);
  }
});

test('changing only date excludes the actually booked profiles', () => {
  const result = selectMatches(catalog, { ...query, eventDate: '2026-10-01' }).result;
  assert.deepEqual(result.cards.map(card => card.id), ['HK-88430', 'HK-44923']);
  assert.equal(result.candidatesBeforeCut, 2);
  assert.match(result.message, /бос емес: 6/);
  assert.ok(catalog.contractors.find(p => p.id === 'HK-44733')!.busyDates.has('2026-10-01'));
  assert.ok(catalog.contractors.find(p => p.id === 'HK-35215')!.busyDates.has('2026-10-01'));
});

test('rare category, null hours and data flags are preserved', () => {
  const result = selectMatches(catalog, { city: 'Алматы', category: 'Флорист', eventType: 'корпоратив', eventDate: '2026-10-04', budgetKzt: 300000, durationHours: 24 }).result;
  assert.equal(result.candidatesBeforeCut, 1);
  assert.deepEqual(result.cards.map(card => card.id), ['HK-39372']);
  assert.ok(result.cards[0]!.dataFlags.includes('priceImputed'));
  assert.match(result.message, /форматын қабылдамайды: 1/);
});

test('empty category and filtered-out candidates are different outcomes with reasons', () => {
  assert.equal(selectMatches(catalog, { ...query, city: 'Астана', category: 'Декоратор' }).result.status, 'no_category');
  const empty = selectMatches(catalog, { ...query, budgetKzt: 1000 }).result;
  assert.equal(empty.status, 'no_match');
  assert.equal(empty.candidatesBeforeCut, 0);
  assert.deepEqual(empty.cards, []);
  assert.match(empty.message, /бюджеттен жоғары: 10/);
});

test('each hard constraint excludes independently; equal scores sort by ID, never price', () => {
  const base: Contractor = { id: 'B', name: 'Demo', city: 'Алматы', categories: ['Ведущий'], priceFromKzt: 100,
    eventFormats: ['корпоратив'], languages: ['ru'], maxHours: 5, busyDates: new Set(),
    description: 'Организует корпоративные мероприятия и деловые встречи.', synthetic: true, cityImputed: false, priceImputed: false };
  const local: Catalog = { ...catalog, contractors: [{ ...base, id: 'A', priceFromKzt: 900 }, base] };
  const request = { ...query, budgetKzt: 1000 };
  assert.deepEqual(selectMatches(local, request).result.cards.map(p => p.id), ['A', 'B']);
  assert.deepEqual(selectMatches(local, { ...request, budgetKzt: 5000 }).result.cards.map(p => p.id), ['A', 'B']);
  assert.equal(selectMatches(local, { ...request, budgetKzt: 100 }).result.cards[0]?.id, 'B');
  for (const change of [{ eventType: 'свадьба' }, { budgetKzt: 99 }, { language: 'kz' as const }, { durationHours: 5.01 }]) {
    assert.equal(selectMatches(local, { ...request, ...change }).result.status, 'no_match');
  }
  assert.equal(selectMatches({ ...local, contractors: [{ ...base, busyDates: new Set([query.eventDate]) }] }, request).result.status, 'no_match');
});

test('request validation rejects impossible dates, unsupported IDs, null, unknown fields and numeric strings', () => {
  const schema = createMatchSchema(catalog.options);
  assert.ok(schema.safeParse(query).success);
  for (const change of [{ eventDate: '2026-11-31' }, { eventDate: '2027-01-01' }, { eventDate: '2026-09-22' }, { budgetKzt: '1000' },
    { budgetKzt: 0 }, { budgetKzt: 1.5 }, { durationHours: null }, { durationHours: -1 }, { language: 'kk' }, { city: 'almaty' }, { mystery: true }]) {
    assert.equal(schema.safeParse({ ...query, ...change }).success, false, JSON.stringify(change));
  }
  for (const day of ['2026-09-23', '2026-12-31']) assert.ok(schema.safeParse({ ...query, eventDate: day }).success);
});

test('all 100 days keep matching conditions and deterministic IDs', () => {
  for (let offset = 0; offset < 100; offset += 1) {
    const day = new Date(Date.UTC(2026, 8, 23 + offset)).toISOString().slice(0, 10);
    const input = { ...query, eventDate: day };
    const result = selectMatches(catalog, input).result;
    assert.ok(result.cards.length <= 3);
    assert.equal(result.cards.length, Math.min(3, result.candidatesBeforeCut));
    assert.deepEqual(ids(input), ids(input));
    for (const card of result.cards) assert.equal(catalog.contractors.find(p => p.id === card.id)!.busyDates.has(day), false);
  }
});
