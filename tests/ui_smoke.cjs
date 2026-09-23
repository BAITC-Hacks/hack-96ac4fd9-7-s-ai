/* DOM integration only: no browser automation or visual rendering checks.
 * Start server.py first. Optional dev dependency setup is documented in README.
 */
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('../.local/dom-check/node_modules/jsdom');
const base = process.env.FIREBIRD_URL || 'http://127.0.0.1:8000';
const windows = [];
const errors = [];
let passed = 0;
const wait = async (check, label) => {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error('Timed out: ' + label);
};
const check = label => { passed++; console.log('PASS ' + label); };
const snapshot = storage => Object.fromEntries(Array.from({ length: storage.length }, (_, i) => storage.key(i)).map(key => [key, storage.getItem(key)]));
async function page(path, local = {}, session = {}) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    // jsdom has no navigation implementation; reruns are checked by opening
    // a new DOM with the emitted session prefill. CSS layout is outside scope.
    if (error.type === 'not-implemented' && /navigation/i.test(error.message)) return;
    if (error.type !== 'css-parsing') errors.push(error.message);
  });
  const dom = await JSDOM.fromURL(base + path, {
    resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.fetch = (input, options) => fetch(new URL(input, window.location.href), options);
      window.AbortController = AbortController;
      window.matchMedia = () => ({ matches: false });
      window.HTMLElement.prototype.scrollIntoView = () => {};
      Object.entries(local).forEach(([key, value]) => window.localStorage.setItem(key, value));
      Object.entries(session).forEach(([key, value]) => window.sessionStorage.setItem(key, value));
    }
  });
  windows.push(dom.window);
  const document = dom.window.document;
  await wait(() => document.readyState === 'complete' && dom.window.FirebirdStore, path + ' scripts');
  return { window: dom.window, document, $: selector => document.querySelector(selector), all: selector => [...document.querySelectorAll(selector)] };
}
async function main() {
  const root = await page('/match');
  await wait(() => !root.$('#submit-button').disabled, 'metadata');
  assert.equal(root.all('.demo-button').length, 6);
  root.$('[data-demo="corporate"]').click();
  await wait(() => root.all('.contractor-card').length === 3, 'matching cards');
  const firstIds = root.all('[data-favorite-id]').map(button => button.dataset.favoriteId);
  assert.equal(root.all('.card-profile-link').length, 3);
  root.$('[data-favorite-id]').click();
  root.all('[data-compare-id]').forEach(button => button.click());
  assert.equal(root.window.FirebirdStore.getFavorites().length, 1);
  assert.equal(root.window.FirebirdStore.getCompare().length, 3);
  assert.equal(root.window.FirebirdStore.toggleCompare('HK-90001').full, true);
  assert.equal(root.$('[data-store-count="compare"]').textContent, '3');
  check('matching → profile links, favorites, comparison limit and counters');

  root.$('[data-demo="another-date"]').click();
  await wait(() => root.$('.date-change-note') && root.all('.contractor-card').length === 3, 'new date');
  assert.notDeepEqual(root.all('[data-favorite-id]').map(button => button.dataset.favoriteId), firstIds);
  assert.match(root.$('.date-change-note').textContent, /Буллма/);
  root.$('[data-language="ru"]').click();
  await wait(() => root.document.documentElement.lang === 'ru' && root.all('.contractor-card').length === 3, 'Russian results');
  assert.equal(root.window.FirebirdStore.getLanguage(), 'ru');
  assert.equal(root.window.FirebirdStore.getHistory().length, 2);
  check('date change explanation, Russian UI and unique query history');

  root.$('[data-demo="budget"]').click();
  await wait(() => root.$('.empty-state') && root.$('.suggestion-button'), 'budget recovery');
  root.$('.suggestion-button').click();
  await wait(() => root.all('.contractor-card').length === 1, 'relaxed budget');
  assert.equal(root.$('#budget_kzt').value, '500000');
  assert.equal(root.$('[data-favorite-id]').dataset.favoriteId, 'HK-88430');
  check('empty result → verified minimum budget → eligible contractor');

  const local = snapshot(root.window.localStorage);
  const catalog = await page('/catalog', local);
  await wait(() => catalog.all('.directory-card').length === 12, 'catalog page 1');
  const oldName = catalog.$('.directory-name').textContent;
  catalog.all('.pagination-button')[1].click();
  await wait(() => catalog.all('.directory-card').length === 12 && catalog.$('.directory-name').textContent !== oldName, 'catalog page 2');
  assert.match(catalog.window.location.search, /page=2/);
  catalog.$('#catalog-q').value = 'Хаул';
  catalog.$('.catalog-toolbar').dispatchEvent(new catalog.window.Event('submit', { bubbles: true, cancelable: true }));
  await wait(() => catalog.all('.directory-card').length === 1, 'catalog search');
  assert.equal(catalog.$('.directory-name').textContent, 'Хаул');
  assert.match(catalog.$('.profile-link').href, /HK-77838/);
  check('catalog pagination, query search and profile links');

  const detail = await page('/contractor/HK-44733?date=2026-10-10', local);
  await wait(() => detail.$('.calendar-choice'), 'profile detail');
  const source = await (await fetch(base + '/api/contractors/HK-44733')).json();
  assert.equal(detail.$('.original-description').textContent, source.description);
  assert(detail.$('.calendar-choice .status-busy'));
  detail.all('.calendar-day').find(button => button.textContent === '9').click();
  assert(detail.$('.calendar-choice .status-free'));
  assert.match(detail.window.location.search, /2026-10-09/);
  check('profile exact source, busy calendar and selected date updates');

  const saved = await page('/saved', local);
  await wait(() => saved.all('.directory-card').length === 1, 'saved profile');
  assert.match(saved.$('.profile-link').href, new RegExp(firstIds[0]));
  saved.$('[data-favorite]').click();
  await wait(() => saved.$('.portal-empty'), 'remove saved');
  assert.equal(saved.window.FirebirdStore.getFavorites().length, 0);
  check('favorites survive page navigation and removal shows empty state');

  const comparison = await page('/compare?date=2026-10-10', local);
  await wait(() => comparison.all('.comparison-profile').length === 3, 'comparison');
  assert.equal(comparison.$('#compare-date').value, '2026-10-10');
  assert.equal(comparison.all('.comparison-table .status-busy').length, 1);
  comparison.$('#compare-date').value = '2026-10-09';
  comparison.$('#compare-date').dispatchEvent(new comparison.window.Event('change', { bubbles: true }));
  await wait(() => comparison.all('.comparison-profile').length === 3 && comparison.all('.comparison-table .status-busy').length === 0, 'comparison new date');
  comparison.$('.comparison-profile-top .text-button').click();
  await wait(() => comparison.all('.comparison-profile').length === 2, 'remove comparison');
  check('three profiles compared on actual dates and removable');

  const history = await page('/history', local);
  await wait(() => history.all('.history-card').length === 4, 'query history');
  history.$('.history-card .portal-button').click();
  const session = snapshot(history.window.sessionStorage);
  assert(session['firebird.prefill']);
  const rerun = await page('/match', local, session);
  await wait(() => rerun.all('.contractor-card').length === 1, 'history rerun');
  assert.equal(rerun.$('#budget_kzt').value, '500000');
  assert.equal(rerun.window.sessionStorage.getItem('firebird.prefill'), null);
  assert.equal(rerun.window.FirebirdStore.getHistory().length, 4);
  check('history rerun prefills real query without duplicate records');
  assert.deepEqual(errors, [], 'Unexpected JS errors');
  console.log(`\n${passed} DOM integration scenarios passed. Visual layout was not tested.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => windows.forEach(window => window.close()));
