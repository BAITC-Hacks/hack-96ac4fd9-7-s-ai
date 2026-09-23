import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { NotShownCandidate, NotShownReason } from '../../../shared/types';
import type { MessageKey } from '../lib/messages';
import { formatMoney } from '../lib/format';
import { useLocale } from './LocaleProvider';

const REASON_KEYS: Record<NotShownReason, MessageKey> = {
  busy: 'reasonBusy', budget: 'reasonBudget', format: 'reasonFormat',
  language: 'reasonLanguage', duration: 'reasonDuration', rankedLower: 'reasonRankedLower',
};

interface Props {
  items: NotShownCandidate[];
  title: string;
  defaultOpen?: boolean;
}

export default function NotShownList({ items, title, defaultOpen = false }: Props) {
  const { locale, t } = useLocale();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');

  return <div className="mt-6 overflow-hidden rounded-card border border-hairline bg-canvas">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}
      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold hover:bg-surface-soft">
      <span>{title}</span>
      <motion.svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-none stroke-current stroke-2"
        animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
        <path d="m3 6 5 5 5-5" />
      </motion.svg>
    </button>
    <AnimatePresence initial={false}>
      {open && <motion.div id={id} key="list" className="overflow-hidden"
        initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}>
        <ul className="divide-y divide-hairline border-t border-hairline">
          {items.map((item, index) => <motion.li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3"
            initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : Math.min(index, 10) * 0.03 }}>
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="avatar size-8 text-xs">{initials(item.name)}</span>
              <span className="truncate text-sm font-medium">{item.name}</span>
            </span>
            <span className="flex flex-wrap gap-1.5">
              {item.reasons.map((reason) => <span key={reason}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reason === 'rankedLower' ? 'bg-surface-strong text-body' : 'bg-accent-disabled/60 text-accent-active'}`}>
                {t(REASON_KEYS[reason], { price: formatMoney(item.priceFromKzt, locale) })}
              </span>)}
            </span>
          </motion.li>)}
        </ul>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
