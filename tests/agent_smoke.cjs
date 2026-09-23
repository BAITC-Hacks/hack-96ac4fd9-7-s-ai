/* Own-source DOM integration. No live AI requests or provider charges.
 * Success uses an intercepted fixture; fallback comes from the real agent
 * with an explicitly disabled transport, independent of local credentials.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {JSDOM, VirtualConsole} = require('../.local/dom-check/node_modules/jsdom');
const base = process.env.FIREBIRD_URL || 'http://127.0.0.1:8000';
const repo = path.resolve(__dirname, '..');
const windows = [], errors = [];
const wait = async (check, label) => {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 25)); }
  throw Error('Timed out: ' + label);
};
function actualNoKeyFallback(query) {
  const code = [
    'import json,sys',
    'from matcher import load_catalog',
    'from ai_agent import run_agent',
    'class Disabled:',
    ' configured=False',
    ' model="test-disabled-model"',
    ' def __call__(self,*args,**kwargs):',
    '  raise AssertionError("Disabled transport must never be called")',
    'query=json.loads(sys.argv[1])',
    'payload={"message":"Change the city to Astana", "query":query, "ui_language":query.get("ui_language","kk")}',
    'result=run_agent(load_catalog("data/catalog.csv"),payload,Disabled())',
    'print(json.dumps(result,ensure_ascii=True))'
  ].join('\n');
  return JSON.parse(execFileSync('python', ['-c', code, JSON.stringify(query)], {cwd:repo, encoding:'utf8'}));
}
async function main() {
  const parsedQuery = {city:'Алматы', date:'2026-10-10', event_format:'корпоратив', category:'Ведущий', budget_kzt:1000000, language:'русский', duration_hours:4, preferences:'атмосфера', ui_language:'kk'};
  const recommendation = await (await fetch(base + '/api/recommend', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(parsedQuery)})).json();
  assert.equal(recommendation.outcome, 'matches');
  assert.equal(recommendation.cards.length, 3);
  const success = {...recommendation, cards:[...recommendation.cards, {...recommendation.cards[0], id:'MOCK-FOURTH'}], agent:{mode:'ai', model:'test-model', tool_calls:1, input_source:'interpreted', request_ids:[], trace:[{step:'interpret',status:'ok'},{step:'search_contractors',status:'ok'},{step:'explain',status:'ok'}]}};
  const fallback = actualNoKeyFallback(parsedQuery);
  assert.equal(fallback.agent.mode, 'fallback');
  assert.equal(fallback.agent.input_source, 'form');
  assert.equal(fallback.query.city, parsedQuery.city);
  let currentResponse = success;
  let delayedResolve = null;
  let shouldDelay = false;
  const sent = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (error.type !== 'css-parsing') errors.push(error.message); });
  const dom = await JSDOM.fromURL(base + '/match', {
    resources:'usable', runScripts:'dangerously', pretendToBeVisual:true, virtualConsole:vc,
    beforeParse(window) {
      window.fetch = async (input, options) => {
        const url = new URL(input, window.location.href);
        if (url.pathname !== '/api/agent') return fetch(url, options);
        sent.push(JSON.parse(options.body));
        if (shouldDelay) await new Promise(resolve => { delayedResolve = resolve; });
        return new Response(JSON.stringify(currentResponse), {status:200, headers:{'Content-Type':'application/json'}});
      };
      window.AbortController = AbortController;
      window.matchMedia = () => ({matches:false});
      window.HTMLElement.prototype.scrollIntoView = () => {};
    }
  });
  const w = dom.window; windows.push(w);
  const $ = selector => w.document.querySelector(selector);
  const all = selector => [...w.document.querySelectorAll(selector)];
  await wait(() => w.document.readyState === 'complete' && !$('#agent-submit').disabled, 'agent ready');
  $('#agent-demo').click();
  assert.match($('#agent-message').value, /2026/);
  $('#agent-form').dispatchEvent(new w.Event('submit', {bubbles:true,cancelable:true}));
  await wait(() => !$('#agent-submit').disabled && $('#agent-trace').classList.contains('is-ai'), 'AI success');
  assert.equal(sent[0].ui_language, 'kk');
  assert(sent[0].message.length > 20);
  assert.equal($('#date').value, parsedQuery.date);
  assert.equal($('#language').value, 'русский');
  assert.equal($('#duration_hours').value, '4');
  assert.equal(all('.contractor-card').length, 3, 'UI keeps max-three limit');
  assert.equal(all('.agent-step.is-ok').length, 3);
  assert.match($('#agent-trace').textContent, /search_contractors/);
  assert.match($('.agent-run-facts').textContent, /1/);
  assert.match($('.agent-applied-query').textContent, /Орыс тілі/);
  assert.match($('.agent-applied-query').textContent, /4 сағ/);
  assert.equal(w.FirebirdStore.getHistory().length, 1);
  console.log('PASS parsed AI request fills form, uses max-three cards, records history and renders actual tool trace');

  currentResponse = fallback;
  $('#agent-message').value = 'Астанада жүргізуші керек';
  $('#agent-form').dispatchEvent(new w.Event('submit', {bubbles:true,cancelable:true}));
  await wait(() => !$('#agent-submit').disabled && $('#agent-trace').classList.contains('is-fallback'), 'actual no-key fallback');
  assert.equal($('#city').value, 'Алматы', 'No-key fallback retains form city despite the natural-language request');
  assert.match($('.agent-fallback-note').textContent, /бастапқы шарттар/);
  assert.match($('.agent-fallback-note').textContent, /талданды деп есептелмейді/);
  assert.equal($('#agent-trace').classList.contains('is-ai'), false);
  assert.equal(all('.contractor-card').length, fallback.cards.length);
  console.log('PASS actual disabled-provider fallback clearly identifies original form conditions and never claims AI success');

  currentResponse = success; shouldDelay = true;
  $('#agent-form').dispatchEvent(new w.Event('submit', {bubbles:true,cancelable:true}));
  await wait(() => delayedResolve, 'pending agent response');
  $('[data-demo="corporate"]').click();
  await wait(() => !$('#submit-button').disabled && all('.contractor-card').length === 3 && $('#date').value === '2026-10-09', 'manual result supersedes AI');
  const visibleIds = all('[data-favorite-id]').map(node => node.dataset.favoriteId);
  delayedResolve();
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal($('#date').value, '2026-10-09');
  assert.deepEqual(all('[data-favorite-id]').map(node => node.dataset.favoriteId), visibleIds);
  assert.equal($('#agent-trace').hidden, true);
  assert.deepEqual(errors, []);
  console.log('PASS a late AI response cannot replace a newer manual search');
  console.log('\n3 agent DOM scenarios passed; no live AI calls or visual layout tests.');
}
main().catch(error => {console.error(error);process.exitCode=1;}).finally(() => windows.forEach(window => window.close()));
