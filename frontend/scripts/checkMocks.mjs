import assert from 'node:assert/strict';
import { mockCreateMatch, DEMO_INPUT, FOUND_FIXTURE, NO_CATEGORY_FIXTURE, NO_MATCH_FIXTURE } from '../src/api/mocks.ts';

function result(overrides = {}) {
  const response = mockCreateMatch({ ...DEMO_INPUT, ...overrides });
  assert.equal(response.ok, true);
  return response.data;
}
assert.equal(FOUND_FIXTURE.status, 'found');
assert.equal(FOUND_FIXTURE.cards.length, 3);
assert.equal(NO_CATEGORY_FIXTURE.status, 'no_category');
assert.equal(NO_MATCH_FIXTURE.status, 'no_match');
const busy = result({ eventDate: '2026-11-15' });
assert.equal(busy.cards.length, 1);
assert.equal(busy.cards[0].id, 'host-03');
assert.match(busy.message, /занят.*2026-11-15/);
assert.equal(result({ category: 'Скрипач' }).cards.length, 1);
assert.equal(result({ budgetKzt: 100000 }).cards.length, 1);
assert.equal(result({ budgetKzt: 99999 }).status, 'no_match');
assert.equal(result({ language: 'en' }).cards[0].id, 'host-02');
assert.equal(result({ durationHours: 7 }).cards[0].id, 'host-02');
assert.equal(result({ eventType: 'Корпоратив' }).cards.length, 2);
assert.deepEqual(result(), result());
assert.equal(mockCreateMatch({ ...DEMO_INPUT, eventDate: '2026-02-30' }).ok, false);
assert.equal(mockCreateMatch({ ...DEMO_INPUT, budgetKzt: 0 }).ok, false);
assert.equal(mockCreateMatch({ ...DEMO_INPUT, durationHours: -1 }).ok, false);
for (const card of result().cards) {
  assert.ok(card.dataFlags.includes('synthetic'));
  assert.match(card.explanation, /бюджет/);
}
console.log('PASS: 3 fixtures; date 3 → 1 → 0; rare category; inclusive budget; language; duration; format; deterministic order; validation; flags.');
console.log(JSON.stringify({ busy, noMatch: NO_MATCH_FIXTURE }, null, 2));
