import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';

export interface DropdownOption { value: string; label: string }

interface Props {
  name: string;
  label: string;
  options: DropdownOption[];
  /** Shown while no option is chosen. */
  placeholder?: string;
  defaultValue?: string;
  /** "segment" sits inside the search pill; "field" looks like a regular input. */
  variant?: 'segment' | 'field';
  className?: string;
}

const Chevron = ({ open }: { open: boolean }) => <motion.svg aria-hidden="true" viewBox="0 0 16 16"
  className="size-3.5 shrink-0 fill-none stroke-current stroke-2" animate={{ rotate: open ? 180 : 0 }}
  transition={{ type: 'spring', stiffness: 420, damping: 28 }}>
  <path d="m3 6 5 5 5-5" />
</motion.svg>;

const Check = () => <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 fill-none stroke-accent stroke-[2.2]">
  <path d="m3 8.5 3.2 3L13 4.5" />
</svg>;

export default function Dropdown({ name, label, options, placeholder = '', defaultValue = '', variant = 'segment', className = '' }: Props) {
  const reduce = useReducedMotion();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // Stays true until the closing animation finishes, so the list fades out before it is hidden.
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const optionId = (index: number) => `${id}-option-${index}`;

  const show = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(index);
    setVisible(true);
    setOpen(true);
  };
  const hide = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) setValue(option.value);
    hide(true);
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) hide(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (open && event.key === 'Escape') {
      event.preventDefault();
      hide(true);
    } else if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      show(event.key === 'ArrowUp' && selectedIndex < 0 ? options.length - 1 : undefined);
    }
  };
  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    if (event.key === 'ArrowDown') setActive((index) => Math.min(last, index + 1));
    else if (event.key === 'ArrowUp') setActive((index) => Math.max(0, index - 1));
    else if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(last);
    else if (event.key === 'Enter' || event.key === ' ') choose(active);
    else if (event.key === 'Escape') hide(true);
    else if (event.key === 'Tab') { hide(false); return; }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Type-ahead: jump to the next option whose label starts with the typed letter.
      const letter = event.key.toLocaleLowerCase();
      const order = options.map((_, index) => (active + 1 + index) % options.length);
      const match = order.find((index) => options[index]!.label.toLocaleLowerCase().startsWith(letter));
      if (match !== undefined) setActive(match);
    } else return;
    event.preventDefault();
  };

  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 520, damping: 34 };
  const panel: Variants = {
    closed: { opacity: 0, y: -6, scale: 0.97, transition: reduce ? { duration: 0 } : { duration: 0.12 } },
    open: { opacity: 1, y: 0, scale: 1,
      transition: { ...spring, staggerChildren: reduce ? 0 : 0.018, delayChildren: reduce ? 0 : 0.02 } },
  };
  const item: Variants = { closed: { opacity: 0, y: -4 }, open: { opacity: 1, y: 0, transition: spring } };

  const shown = selected?.label ?? placeholder;
  const valueClass = `truncate ${selected && selected.value !== '' ? 'text-ink' : 'text-muted'}`;
  const labelId = `${id}-label`;

  return <div ref={rootRef} className={`${variant === 'segment' ? 'segment-shell' : 'field relative'} ${className}`.trim()}>
    {variant === 'field' && <span id={labelId}>{label}</span>}
    <button ref={buttonRef} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
      {...(variant === 'field' ? { 'aria-labelledby': `${labelId} ${id}-value` } : {})}
      className={variant === 'segment' ? 'segment-trigger' : 'dropdown-field'}
      onClick={() => (open ? hide(false) : show())} onKeyDown={onButtonKeyDown}>
      {variant === 'segment' && <span className="segment-label">{label}</span>}
      <span className="flex w-full min-w-0 items-center justify-between gap-2">
        <span id={`${id}-value`} className={valueClass} title={shown}>{shown}</span>
        <Chevron open={open} />
      </span>
    </button>
    <input type="hidden" name={name} value={value} />
    <motion.ul ref={listRef} id={`${id}-list`} role="listbox" tabIndex={-1} aria-label={label}
      aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
      className="dropdown-panel" data-open={open} data-visible={open || visible} style={{ transformOrigin: 'top left' }}
      initial={false} animate={open ? 'open' : 'closed'} variants={panel} onKeyDown={onListKeyDown}
      onAnimationComplete={(definition) => { if (definition === 'closed') setVisible(false); }}>
      {options.map((option, index) => <motion.li key={option.value} id={optionId(index)} role="option"
        aria-selected={option.value === value} data-active={index === active} data-value={option.value}
        className="dropdown-option" variants={item}
        onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
        {option.value === value ? <Check /> : <span className="size-4 shrink-0" />}<span className="truncate">{option.label}</span>
      </motion.li>)}
    </motion.ul>
  </div>;
}
