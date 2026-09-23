/* Own-source DOM integration, not browser automation or visual QA. */
const assert = require('node:assert/strict');
const {JSDOM, VirtualConsole} = require('../.local/dom-check/node_modules/jsdom');
const base = process.env.FIREBIRD_URL || 'http://127.0.0.1:8000';
const windows = [], errors = [];
const wait = async (fn, label) => {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) { if (fn()) return; await new Promise(r => setTimeout(r, 25)); }
  throw Error('Timed out: ' + label);
};
const snapshot = s => Object.fromEntries(Array.from({length:s.length}, (_,i) => s.key(i)).map(k => [k,s.getItem(k)]));
let checks = 0;
const pass = label => { checks++; console.log('PASS ' + label); };
async function page(path, local = {}, session = {}) {
  const downloads = [], printed = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (e.type !== 'css-parsing' && !(e.type === 'not-implemented' && /navigation/.test(e.message))) errors.push(e.message); });
  const dom = await JSDOM.fromURL(base + path, {
    runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, virtualConsole:vc,
    beforeParse(w) {
      w.fetch = (url, options) => fetch(new URL(url, w.location.href), options);
      w.AbortController = AbortController; w.Blob = Blob;
      w.matchMedia = () => ({matches:false});
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.URL.createObjectURL = blob => { downloads.push(blob); return 'blob:firebird-test'; };
      w.URL.revokeObjectURL = () => {};
      w.print = () => printed.push(true);
      Object.entries(local).forEach(([k,v]) => w.localStorage.setItem(k,v));
      Object.entries(session).forEach(([k,v]) => w.sessionStorage.setItem(k,v));
    }
  });
  const w = dom.window; windows.push(w);
  await wait(() => w.document.readyState === 'complete', 'scripts ' + path);
  return {w, $:s=>w.document.querySelector(s), all:s=>[...w.document.querySelectorAll(s)], downloads, printed};
}
async function main() {
  const home = await page('/');
  await wait(() => home.all('.category-link').length === 17, 'actual categories');
  assert.equal(home.all('.format-tile').length, 6);
  assert.equal(home.all('.idea-card').length, 6);
  assert.equal(home.$('#stat-profiles').textContent, '66');
  assert.equal(home.$('#stat-days').textContent, '100');
  home.$('[data-lang="ru"]').click();
  assert.equal(home.w.document.documentElement.lang, 'ru');
  home.$('[data-plan-idea]').click();
  const prefill = JSON.parse(home.w.sessionStorage.getItem('firebird.plannerPrefill'));
  assert(prefill.categories.length >= 2 && prefill.categories.length <= 4);
  const fromIdea = await page('/planner', snapshot(home.w.localStorage), snapshot(home.w.sessionStorage));
  await wait(() => !fromIdea.$('#plan-submit').disabled && (fromIdea.$('.team-card') || fromIdea.$('.plan-no-team')), 'idea to plan');
  assert.equal(fromIdea.$('#plan-format').value, prefill.event_format);
  assert.equal(fromIdea.$('#plan-budget').value, String(prefill.budget_kzt));
  pass('home has 6 formats, 6 working ideas, 17 real categories and localized planner prefill');

  const plan = await page('/planner');
  await wait(() => !plan.$('#plan-submit').disabled && plan.$('.team-card'), 'initial plan');
  plan.$('#plan-demo').click();
  await wait(() => !plan.$('#plan-submit').disabled && plan.all('.team-card').length === 3 && plan.all('.team-provider').length === 12, 'four-service demo');
  assert.equal(plan.$('#plan-budget').value, '6000000');
  assert.equal(plan.$('#plan-category-count').textContent, '4 / 4');
  assert.equal(plan.all('.radar-day').length, 14);
  assert(plan.$('[data-bundle-id="alternative"] .team-provider-provenance'));
  plan.$('[data-bundle-id="economy"] input').click();
  plan.$('#export-json').click();
  const exported = JSON.parse(await plan.downloads.at(-1).text());
  assert.equal(exported.selected_bundle.total_price_from_kzt, 4450000);
  assert.equal(new Set(exported.selected_bundle.items.map(i=>i.id)).size, 4);
  assert.equal(exported.query.date, '2026-10-09');
  pass('four services, three complete teams, exact economy budget and valid JSON export');

  plan.$('#plan-budget').value = '4000000';
  plan.$('#plan-budget').dispatchEvent(new plan.w.Event('input', {bubbles:true}));
  assert.equal(plan.$('#export-json').disabled, true);
  plan.$('#planner-form').dispatchEvent(new plan.w.Event('submit', {bubbles:true,cancelable:true}));
  await wait(() => plan.$('.plan-minimum button') && !plan.$('#plan-submit').disabled, 'minimum budget recovery');
  plan.$('.plan-minimum button').click();
  await wait(() => plan.$('.team-card') && !plan.$('#plan-submit').disabled, 'minimum accepted');
  assert.equal(plan.$('#plan-budget').value, '4450000');
  plan.$('[data-radar-date="2026-10-10"]').click();
  await wait(() => plan.$('.team-card') && !plan.$('#plan-submit').disabled, 'new date result');
  assert.equal(plan.$('#plan-date').value, '2026-10-10');
  assert.equal(plan.$('#plan-budget').value, '4450000');
  plan.$('[data-bundle-id="economy"] input')?.click();
  plan.$('#export-json').click();
  const nextDate = JSON.parse(await plan.downloads.at(-1).text());
  assert.equal(nextDate.selected_bundle.total_price_from_kzt, 3950000);
  assert.equal(nextDate.query.date, '2026-10-10');
  pass('dirty export prevention, exact budget recovery and date radar reruns without changing budget');

  plan.$('#checklist-items input[type=checkbox]').click();
  plan.$('#checklist-new').value = 'Қонақтар тізімін дайындау';
  plan.$('#checklist-add-form').dispatchEvent(new plan.w.Event('submit', {bubbles:true,cancelable:true}));
  assert.equal(plan.all('.checklist-item').length, 6);
  assert.equal(plan.$('#checklist-count').textContent, '1 / 6');
  plan.$('#project-name').value = 'Firebird demo';
  plan.$('#save-project').click();
  const saved = JSON.parse(plan.w.localStorage.getItem('firebird.plannerProject'));
  assert.equal(saved.name, 'Firebird demo');
  assert.equal(saved.selected_bundle_ids.length, 4);
  assert.equal(saved.query.date, '2026-10-10');
  plan.$('#export-txt').click();
  assert.match(await plan.downloads.at(-1).text(), /Қонақтар тізімін дайындау/);
  plan.$('#print-plan').click();
  assert.equal(plan.printed.length, 1);
  assert.equal(plan.all('#print-content .print-provider').length, 4);
  const restored = await page('/planner', snapshot(plan.w.localStorage));
  await wait(() => restored.$('.team-card') && !restored.$('#plan-submit').disabled, 'saved project revalidation');
  assert.equal(restored.$('#project-name').value, 'Firebird demo');
  assert.equal(restored.$('#plan-date').value, '2026-10-10');
  assert.equal(restored.$('#checklist-count').textContent, '1 / 6');
  pass('editable checklist, local project restore, TXT export and print document construction');

  home.$('[data-match-idea]').click();
  const matching = await page('/match', snapshot(home.w.localStorage), snapshot(home.w.sessionStorage));
  await wait(() => !matching.$('#submit-button').disabled && (matching.$('.contractor-card') || matching.$('.empty-state')), 'idea to single matching');
  assert.equal(matching.w.document.documentElement.lang, 'ru');
  assert.equal(matching.$('#event_format').value, JSON.parse(home.w.sessionStorage.getItem('firebird.prefill')).event_format);
  pass('idea starter preserves the original matching flow and selected language');
  assert.deepEqual(errors, [], 'Unhandled JS errors');
  console.log(`\n${checks} product DOM scenarios passed. Visual layout not tested.`);
}
main().catch(error => {console.error(error); process.exitCode=1;}).finally(()=>windows.forEach(w=>w.close()));
