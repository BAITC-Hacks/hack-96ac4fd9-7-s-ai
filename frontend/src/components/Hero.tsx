import type { CSSProperties, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { CalendarCheck, Check, Quote, Wallet } from 'lucide-react';
import type { CatalogOptions } from '../../../shared/types';
import { useLocale } from './LocaleProvider';
import GlassAvatar from './GlassAvatar';

// Glass figures read these pointer variables; outside a ProfileCard they sit at the centre.
const NEUTRAL_POINTER = { '--pointer-from-left': 0.5, '--pointer-from-top': 0.5 } as CSSProperties;

const DEMO_CARDS: { id: string; gender: 'female' | 'male'; className: string; rotate: number; delay: number }[] = [
  { id: 'hero-aigerim', gender: 'female', className: 'top-0 left-4', rotate: -5, delay: 0 },
  { id: 'hero-nurlan', gender: 'male', className: 'top-28 right-0', rotate: 4, delay: 1.2 },
  { id: 'hero-dana', gender: 'female', className: 'bottom-0 left-12', rotate: -2, delay: 2.4 },
];

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-card border border-white/70 bg-canvas/70 p-4 shadow-float backdrop-blur-md">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-disabled/60 text-accent">{icon}</span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs leading-5 text-muted">{text}</span>
    </span>
  </div>;
}

export default function Hero({ catalog }: { catalog: CatalogOptions | null }) {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const container: Variants = { hidden: {}, shown: { transition: { staggerChildren: reduce ? 0 : 0.09 } } };
  const item: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 16 },
    shown: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: [0.23, 1, 0.32, 1] } },
  };

  return <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
    <motion.div variants={container} initial="hidden" animate="shown">
      <motion.p variants={item} className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas/80 px-3 py-1.5 text-xs font-semibold backdrop-blur">
        <span className="relative flex size-2">
          {!reduce && <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />}
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        {t('heroEyebrow')}
      </motion.p>

      <motion.h1 variants={item} className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
        {t('heroBefore')}
        <span className="relative inline-block whitespace-nowrap">
          <span className="bg-gradient-to-r from-accent via-[#ff5a5f] to-[#ff8a5c] bg-clip-text text-transparent">{t('heroAccent')}</span>
          <svg aria-hidden="true" viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full overflow-visible">
            <motion.path d="M2 9 C 50 2, 150 2, 198 8" fill="none" stroke="#ff385c" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.9, delay: 0.5, ease: 'easeOut' }} />
          </svg>
        </span>
        {t('heroAfter')}
      </motion.h1>

      <motion.p variants={item} className="mt-5 max-w-2xl text-base leading-7 text-body sm:text-lg">{t('heroIntro')}</motion.p>

      <motion.div variants={item} className="mt-7 grid gap-3 sm:grid-cols-3">
        <Feature icon={<CalendarCheck className="size-5" />} title={t('heroDate')} text={t('heroDateText')} />
        <Feature icon={<Wallet className="size-5" />} title={t('heroBudget')} text={t('heroBudgetText')} />
        <Feature icon={<Quote className="size-5" />} title={t('heroFacts')} text={t('heroFactsText')} />
      </motion.div>

      {catalog && <motion.p variants={item} className="mt-5 text-sm font-medium text-muted">
        {t('heroStats', { categories: catalog.categories.length, cities: catalog.cities.length })}
      </motion.p>}
    </motion.div>

    {/* Decorative preview of result cards with glass avatars, floating gently. */}
    <div aria-hidden="true" className="relative hidden h-[360px] lg:block" style={NEUTRAL_POINTER}>
      {DEMO_CARDS.map((card, index) => <motion.div key={card.id} className={`absolute w-60 ${card.className}`}
        initial={reduce ? false : { opacity: 0, y: 24, rotate: card.rotate }}
        animate={reduce ? { rotate: card.rotate } : { opacity: 1, y: [0, -10, 0], rotate: card.rotate }}
        transition={reduce ? undefined : {
          opacity: { duration: 0.6, delay: 0.3 + index * 0.15 },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: card.delay },
        }}>
        <div className="rounded-card border border-white/80 bg-canvas/75 p-4 shadow-float backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="size-16 shrink-0"><GlassAvatar id={card.id} gender={card.gender} /></div>
            <div className="min-w-0 flex-1">
              <div className="h-2.5 w-28 rounded-full bg-ink/80" />
              <div className="mt-2 h-2 w-16 rounded-full bg-hairline" />
            </div>
          </div>
          {index === 2
            ? <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-soft p-2.5 text-xs font-semibold text-body">
              <Quote className="size-3.5 shrink-0 text-accent" />{t('heroCardWhy')}
            </p>
            : <div className="mt-3 flex flex-wrap gap-1.5">
              {[t('heroCardFree'), t('heroCardBudget')].map((label) => <span key={label} className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-body">
                <Check className="size-3 text-accent" />{label}
              </span>)}
            </div>}
        </div>
      </motion.div>)}
    </div>
  </div>;
}
