import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useLocale } from './LocaleProvider';
import { catalogLabel } from '../lib/catalogLabels';
import { formatDate, formatMoney } from '../lib/format';
import type { MessageKey } from '../lib/messages';

const STEP_MS = 4000;
const svg = (path: ReactNode) => <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[1.8]"
  strokeLinecap="round" strokeLinejoin="round">{path}</svg>;

// The metrics are the real numbers of the example query against the bundled dataset.
const STEPS: { title: MessageKey; body: MessageKey; metric: MessageKey; icon: ReactNode }[] = [
  { title: 'howRequestTitle', body: 'howRequestBody', metric: 'howRequestMetric',
    icon: svg(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>) },
  { title: 'howFilterTitle', body: 'howFilter', metric: 'howFilterMetric',
    icon: svg(<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" />) },
  { title: 'howOrderTitle', body: 'howOrder', metric: 'howOrderMetric',
    icon: svg(<path d="M5 6h14M5 12h9M5 18h5M18 14v6m0 0-2.5-2.5M18 20l2.5-2.5" />) },
  { title: 'howExplainTitle', body: 'howExplain', metric: 'howExplainMetric',
    icon: svg(<><path d="M5 5h14v10H9l-4 4z" /><path d="M9 9h6M9 12h4" /></>) },
  { title: 'howResultTitle', body: 'howResultBody', metric: 'howResultMetric',
    icon: svg(<><rect x="3" y="6" width="7" height="12" rx="1.5" /><rect x="14" y="6" width="7" height="12" rx="1.5" /></>) },
];

export default function HowItWorks() {
  const { locale, t } = useLocale();
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const running = inView && !reduce;

  // One timer per step: choosing a step restarts the countdown from there instead of stopping playback.
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setActive((index) => (index + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(timer);
  }, [running, active]);
  const progress = active / (STEPS.length - 1);
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 120, damping: 22 };
  const query = [catalogLabel('Алматы', locale), catalogLabel('Ведущий', locale), formatDate('2026-10-06', locale),
    formatMoney(1000000, locale)].join(' · ');
  const step = STEPS[active]!;

  return <section ref={sectionRef} className="mt-16 border-t border-hairline pt-12">
    <h2 className="text-xl font-semibold">{t('howTitle')}</h2>
    <p className="mt-1 text-sm text-muted">{t('howExample', { query })}</p>

    <div className="relative mt-10">
      {/* Track: a hairline rail with an accent fill that advances with the active step. */}
      <div aria-hidden="true" className="absolute top-6 right-[10%] left-[10%] hidden h-0.5 bg-hairline lg:block">
        <motion.div className="h-full origin-left bg-accent" initial={false} animate={{ scaleX: progress }} transition={spring} />
      </div>
      <div aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-0.5 bg-hairline lg:hidden">
        <motion.div className="w-full origin-top bg-accent" style={{ height: '100%' }} initial={false} animate={{ scaleY: progress }} transition={spring} />
      </div>

      <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
        {STEPS.map((item, index) => {
          const state = index < active ? 'done' : index === active ? 'active' : 'todo';
          return <li key={item.title}>
            <button type="button" aria-current={state === 'active' ? 'step' : undefined} onClick={() => setActive(index)}
              className="group flex w-full items-center gap-4 text-left lg:flex-col lg:text-center">
              <span className="relative flex size-12 shrink-0 items-center justify-center">
                {state === 'active' && !reduce && <motion.span key={`pulse-${active}`} aria-hidden="true" className="absolute inset-0 rounded-full bg-accent"
                  initial={{ scale: 1, opacity: 0.35 }} animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />}
                <motion.span className="relative flex size-12 items-center justify-center rounded-full border-2"
                  initial={false} transition={{ duration: 0.3 }}
                  animate={state === 'active'
                    ? { backgroundColor: '#ff385c', borderColor: '#ff385c', color: '#ffffff', scale: reduce ? 1 : 1.08 }
                    : state === 'done'
                      ? { backgroundColor: '#222222', borderColor: '#222222', color: '#ffffff', scale: 1 }
                      : { backgroundColor: '#ffffff', borderColor: '#dddddd', color: '#6a6a6a', scale: 1 }}>
                  {item.icon}
                </motion.span>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-muted">{index + 1}</span>
                <span className={`block text-base font-semibold ${state === 'todo' ? 'text-muted' : 'text-ink'} group-hover:text-ink`}>{t(item.title)}</span>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${state === 'active' ? 'bg-accent-disabled text-accent-active' : 'bg-surface-soft text-muted'}`}>
                  {t(item.metric)}
                </span>
              </span>
            </button>
          </li>;
        })}
      </ol>
    </div>

    <div className="relative mt-8 min-h-32 overflow-hidden rounded-card bg-surface-soft p-6" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, y: -12 }} transition={{ duration: reduce ? 0 : 0.35 }}>
          <p className="micro-label text-accent">{active + 1} / {STEPS.length} · {t(step.metric)}</p>
          <h3 className="mt-1 text-lg font-semibold">{t(step.title)}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-body">{t(step.body)}</p>
        </motion.div>
      </AnimatePresence>
      {running && <motion.div key={`timer-${active}`} aria-hidden="true" className="absolute bottom-0 left-0 h-1 w-full origin-left bg-accent/40"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: STEP_MS / 1000, ease: 'linear' }} />}
    </div>
  </section>;
}
