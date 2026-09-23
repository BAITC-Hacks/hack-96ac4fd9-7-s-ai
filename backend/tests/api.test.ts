import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { loadCatalog } from '../src/lib/catalog.js';
import type { ApiResponse, MatchResult } from '../../shared/types.js';

test('HTTP contract, CORS, validation, empty states and AI failure fallback', async t => {
  const server = createApp(loadCatalog(), async () => { throw new Error('private upstream detail'); }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const query = { city: 'Алматы', category: 'Ведущий', eventType: 'корпоратив', eventDate: '2026-10-06', budgetKzt: 1000000 };
  const health = await fetch(`${base}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.deepEqual(await health.json(), { ok: true, data: { status: 'up' } });
  assert.equal(health.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const options = await (await fetch(`${base}/api/catalog-options`)).json() as { ok: boolean; data: { languages: string[] } };
  assert.deepEqual(options.data.languages, ['en', 'kz', 'ru']);
  const post = (body: unknown) => fetch(`${base}/api/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const matched = await post(query);
  const found = await matched.json() as ApiResponse<MatchResult>;
  assert.equal(matched.status, 200);
  assert.ok(found.ok);
  assert.equal(found.data.status, 'found');
  assert.ok(found.data.cards.every(card => card.explanation.includes('Профильдегі дерек')));
  assert.deepEqual(Object.keys(found.data).sort(), ['candidatesBeforeCut', 'cards', 'message', 'notShown', 'status']);
  for (const [change, status] of [[{ budgetKzt: 1 }, 'no_match'], [{ city: 'Астана', category: 'Декоратор' }, 'no_category']] as const) {
    const response = await post({ ...query, ...change });
    const body = await response.json() as ApiResponse<MatchResult>;
    assert.equal(response.status, 200);
    assert.ok(body.ok);
    assert.equal(body.data.status, status);
    assert.deepEqual(body.data.cards, []);
  }
  for (const body of [{}, { ...query, eventDate: '2027-01-01' }, { ...query, language: 'kk' }]) assert.equal((await post(body)).status, 400);
  const malformed = await fetch(`${base}/api/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const oversized = await post({ ...query, padding: 'x'.repeat(20000) });
  assert.equal(oversized.status, 400);
  assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
});
