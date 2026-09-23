import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  define: { 'import.meta.env.VITE_USE_MOCKS': '"false"' },
  server: { middlewareMode: true }, appType: 'custom',
});
const originalFetch = globalThis.fetch;
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
try {
  const { createMatch, getCatalogOptions, getHealth, USE_MOCKS } = await server.ssrLoadModule('/src/api/client.ts');
  const { DEMO_INPUT, FOUND_FIXTURE } = await server.ssrLoadModule('/src/api/mocks.ts');
  assert.equal(USE_MOCKS, false);
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/match');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), DEMO_INPUT);
    return reply({ ok: true, data: FOUND_FIXTURE });
  };
  assert.deepEqual((await createMatch(DEMO_INPUT)).data, FOUND_FIXTURE);
  globalThis.fetch = async () => reply({ ok: false, error: { code: 'VALIDATION', message: 'Проверьте бюджет' } }, 400);
  assert.equal((await createMatch(DEMO_INPUT)).error.message, 'Проверьте бюджет');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  assert.equal((await getHealth()).ok, false);
  globalThis.fetch = async () => new Response('<html>server error</html>', { status: 500 });
  assert.equal((await getCatalogOptions()).ok, false);
  globalThis.fetch = async () => reply({ ok: true, data: { cities: null } });
  assert.equal((await getCatalogOptions()).ok, false);
  globalThis.fetch = async () => reply({ ok: true, data: { ...FOUND_FIXTURE, cards: [{}] } });
  assert.equal((await createMatch(DEMO_INPUT)).ok, false);
  globalThis.fetch = async () => reply({ ok: true, data: { status: 'up' } });
  assert.equal((await getHealth()).ok, true);
  console.log('PASS: real API mode, exact POST payload/path, validation error, network error, non-JSON response, malformed catalog/cards, recovery.');
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
