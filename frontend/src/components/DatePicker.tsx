import { useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { useLocale } from './LocaleProvider';
import { formatDate, formatMonth, WEEKDAYS } from '../lib/format';

interface Props {
  name: string;
  label: string;
  min: string;
  max: string;
  defaultValue?: string;
  placeholder?: string;
  /** "segment" sits inside the search pill; "field" is a compact bordered input. */
  variant?: 'segment' | 'field';
  /** Right-align the popover on wide screens (for fields near the right edge). */
  alignRight?: boolean;
}

// All date maths is done in UTC on ISO "YYYY-MM-DD" strings, so time zones never shift a day.
const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
const parts = (value: string) => value.split('-').map(Number) as [number, number, number];
const addDays = (value: string, days: number) => { const [y, m, d] = parts(value); return iso(y, m, d + days); };
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const addMonths = (value: string, months: number) => {
  const [y, m, d] = parts(value);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const ny = first.getUTCFullYear();
  const nm = first.getUTCMonth() + 1;
  return iso(ny, nm, Math.min(d, daysIn(ny, nm)));
};
const monthKey = (value: string) => value.slice(0, 7);
const clampDate = (value: string, min: string, max: string) => (value < min ? min : value > max ? max : value);

function monthCells(key: string): (string | null)[] {
  const [y, m] = key.split('-').map(Number) as [number, number];
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysIn(y, m); d++) cells.push(iso(y, m, d));
  while (cells.length < 42) cells.push(null);
  return cells;
}

const Arrow = ({ dir }: { dir: 'left' | 'right' }) => <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-2">
  <path d={dir === 'left' ? 'm10 3-5 5 5 5' : 'm6 3 5 5-5 5'} />
</svg>;

const CalendarIcon = () => <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-current stroke-[1.5]">
  <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3m5 0v-3" />
</svg>;

export default function DatePicker({ name, label, min, max, defaultValue = '', placeholder = '', variant = 'segment', alignRight = false }: Props) {
  const { locale, t } = useLocale();
  const reduce = useReducedMotion();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(clampDate(defaultValue || min, min, max));
  const [view, setView] = useState(monthKey(focused));
  const [direction, setDirection] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const moveTo = (next: string) => {
    const target = clampDate(next, min, max);
    if (monthKey(target) !== view) {
      setDirection(monthKey(target) > view ? 1 : -1);
      setView(monthKey(target));
    }
    setFocused(target);
  };
  const show = () => {
    const start = clampDate(value || min, min, max);
    setFocused(start);
    setView(monthKey(start));
    setDirection(0);
    setVisible(true);
    setOpen(true);
  };
  const hide = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (date: string) => {
    setValue(date);
    hide(true);
  };
  const changeMonth = (step: number) => {
    const [y, m] = view.split('-').map(Number) as [number, number];
    const next = iso(y, m + step, 1).slice(0, 7);
    if (next < monthKey(min) || next > monthKey(max)) return;
    setDirection(step);
    setView(next);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) hide(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);
  // Roving focus: the focused day is the only tabbable day and receives DOM focus while the panel is open.
  useEffect(() => {
    if (open && monthKey(focused) === view) rootRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus({ preventScroll: true });
  }, [open, focused, view]);

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Read the day from the key's target: focus events may not have updated state yet.
    const from = (event.target as HTMLElement).dataset.date ?? focused;
    const [y, m, d] = parts(from);
    const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(from, -1), ArrowRight: () => addDays(from, 1),
      ArrowUp: () => addDays(from, -7), ArrowDown: () => addDays(from, 7),
      PageUp: () => addMonths(from, -1), PageDown: () => addMonths(from, 1),
      Home: () => addDays(from, -weekday), End: () => addDays(from, 6 - weekday),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveTo(move());
  };
  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (open && event.key === 'Escape') {
      event.preventDefault();
      hide(true);
    }
  };
  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (open && event.relatedTarget && !rootRef.current?.contains(event.relatedTarget as Node)) hide(false);
  };

  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 520, damping: 34 };
  const panel: Variants = {
    closed: { opacity: 0, y: -6, scale: 0.97, transition: reduce ? { duration: 0 } : { duration: 0.12 } },
    open: { opacity: 1, y: 0, scale: 1, transition: spring },
  };
  const slide: Variants = {
    enter: (dir: number) => ({ x: reduce ? 0 : dir * 36, opacity: dir === 0 ? 1 : 0 }),
    center: { x: 0, opacity: 1, transition: spring },
    exit: (dir: number) => ({ x: reduce ? 0 : dir * -36, opacity: 0, transition: { duration: reduce ? 0 : 0.14 } }),
  };

  const [vy, vm] = view.split('-').map(Number) as [number, number];
  const cells = monthCells(view);
  // Keep exactly one tabbable day even after paging to a month without the focused date.
  const tabbable = monthKey(focused) === view ? focused : cells.find((date) => date && date >= min && date <= max) ?? null;
  const canPrev = view > monthKey(min);
  const canNext = view < monthKey(max);
  const shown = value ? formatDate(value, locale) : placeholder;
  const labelId = `${id}-label`;

  return <div ref={rootRef} className={variant === 'segment' ? 'segment-shell' : 'field field-compact relative'}
    onKeyDown={onRootKeyDown} onBlur={onRootBlur}>
    {variant === 'field' && <span id={labelId}>{label}</span>}
    <button ref={buttonRef} type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-panel`}
      {...(variant === 'field' ? { 'aria-labelledby': `${labelId} ${id}-value` } : {})}
      className={variant === 'segment' ? 'segment-trigger' : 'dropdown-field h-10 gap-2 text-sm'}
      onClick={() => (open ? hide(false) : show())}
      onKeyDown={(event) => { if (!open && event.key === 'ArrowDown') { event.preventDefault(); show(); } }}>
      {variant === 'segment' && <span className="segment-label">{label}</span>}
      <span className="flex w-full min-w-0 items-center justify-between gap-2">
        <span id={`${id}-value`} className={`truncate ${value ? 'text-ink' : 'text-muted'}`}>{shown}</span>
        <CalendarIcon />
      </span>
    </button>
    <input type="hidden" name={name} value={value} />
    <motion.div id={`${id}-panel`} role="dialog" aria-label={label}
      className={`calendar-panel ${alignRight ? 'lg:right-0 lg:left-auto' : ''}`}
      data-open={open} data-visible={open || visible} style={{ transformOrigin: alignRight ? 'top right' : 'top left' }}
      initial={false} animate={open ? 'open' : 'closed'} variants={panel}
      onAnimationComplete={(definition) => { if (definition === 'closed') setVisible(false); }}>
      <div className="flex items-center justify-between">
        <button type="button" className="calendar-nav" aria-label={t('prevMonth')} disabled={!canPrev} onClick={() => changeMonth(-1)}><Arrow dir="left" /></button>
        <div className="relative h-6 flex-1 overflow-hidden text-center">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.p key={view} custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
              aria-live="polite" className="text-base font-semibold">{formatMonth(vy, vm, locale)}</motion.p>
          </AnimatePresence>
        </div>
        <button type="button" className="calendar-nav" aria-label={t('nextMonth')} disabled={!canNext} onClick={() => changeMonth(1)}><Arrow dir="right" /></button>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center text-xs font-semibold text-muted">
        {WEEKDAYS[locale].map((day) => <span key={day} className="py-1">{day}</span>)}
      </div>
      <div className="relative mt-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div key={view} custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
            role="group" aria-label={formatMonth(vy, vm, locale)} className="grid grid-cols-7 gap-y-1" onKeyDown={onGridKeyDown}>
            {cells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} className="size-10" />;
              const disabled = date < min || date > max;
              return <motion.button key={date} type="button" data-date={date} className="calendar-day"
                aria-label={formatDate(date, locale)} aria-pressed={date === value} disabled={disabled}
                tabIndex={date === tabbable ? 0 : -1}
                whileHover={disabled || reduce ? undefined : { scale: 1.08 }} whileTap={disabled || reduce ? undefined : { scale: 0.92 }}
                onClick={() => choose(date)} onFocus={() => setFocused(date)}>
                {Number(date.slice(8))}
              </motion.button>;
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-3 border-t border-hairline pt-3 text-xs text-muted">
        {t('calendarRange', { from: formatDate(min, locale), to: formatDate(max, locale) })}
      </p>
    </motion.div>
  </div>;
}
