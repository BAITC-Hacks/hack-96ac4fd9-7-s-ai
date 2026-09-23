import { memo, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './ProfileCard.css';

const ANIMATION_CONFIG = { INITIAL_DURATION: 1200, INITIAL_X_OFFSET: 70, INITIAL_Y_OFFSET: 60, ENTER_TRANSITION_MS: 180 };

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

interface Props {
  /** Top block: name and subtitle. */
  header: ReactNode;
  /** Centre artwork: a transparent portrait or illustration. */
  media: ReactNode;
  /** Glass bar at the bottom. */
  footer: ReactNode;
  enableTilt?: boolean;
  innerGradient?: string;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
}

// Adapted from the provided ProfileCard: same pointer-driven tilt engine and layered shine/glare,
// restyled for the light theme and with content slots instead of fixed profile fields.
function ProfileCardComponent({
  header, media, footer, enableTilt = true,
  innerGradient = 'linear-gradient(160deg, #fff4f6 0%, #ffffff 48%, #f7f7f7 100%)',
  behindGlowColor = 'rgba(255, 56, 92, 0.35)', behindGlowSize = '55%', className = '',
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;
    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;
      const properties: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 7))}deg`,
        '--rotate-y': `${round(centerY / 6)}deg`,
      };
      for (const [key, value] of Object.entries(properties)) wrap.style.setProperty(key, value);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      // Stop the loop once settled, so idle cards do not keep a frame loop running.
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) rafId = requestAnimationFrame(step);
      else { running = false; lastTs = 0; rafId = null; }
    };
    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };
    return {
      setImmediate(x: number, y: number) { currentX = x; currentY = y; setVarsFromXY(x, y); },
      setTarget(x: number, y: number) { targetX = x; targetY = y; start(); },
      toCenter() {
        const shell = shellRef.current;
        if (shell) this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs: number) { initialUntil = performance.now() + durationMs; start(); },
      getCurrent() { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      },
    };
  }, [enableTilt]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!tiltEngine || !shell) return;
    const offsets = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      shell.classList.add('active', 'entering');
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = window.setTimeout(() => shell.classList.remove('entering'), ANIMATION_CONFIG.ENTER_TRANSITION_MS);
      const { x, y } = offsets(event);
      tiltEngine.setTarget(x, y);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const { x, y } = offsets(event);
      tiltEngine.setTarget(x, y);
    };
    const onLeave = () => {
      tiltEngine.toCenter();
      const checkSettle = () => {
        const { x, y, tx, ty } = tiltEngine.getCurrent();
        if (Math.hypot(tx - x, ty - y) < 0.6) {
          shell.classList.remove('active');
          leaveRafRef.current = null;
        } else leaveRafRef.current = requestAnimationFrame(checkSettle);
      };
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      leaveRafRef.current = requestAnimationFrame(checkSettle);
    };
    shell.addEventListener('pointerenter', onEnter);
    shell.addEventListener('pointermove', onMove);
    shell.addEventListener('pointerleave', onLeave);
    tiltEngine.setImmediate((shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET, ANIMATION_CONFIG.INITIAL_Y_OFFSET);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
    return () => {
      shell.removeEventListener('pointerenter', onEnter);
      shell.removeEventListener('pointermove', onMove);
      shell.removeEventListener('pointerleave', onLeave);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering');
    };
  }, [tiltEngine]);

  const cardStyle = useMemo(() => ({
    '--inner-gradient': innerGradient, '--behind-glow-color': behindGlowColor, '--behind-glow-size': behindGlowSize,
  }) as CSSProperties, [innerGradient, behindGlowColor, behindGlowSize]);

  return <div ref={wrapRef} className={`pc-card-wrapper ${className}`.trim()} style={cardStyle}>
    <div className="pc-behind" aria-hidden="true" />
    <div ref={shellRef} className="pc-card-shell">
      <section className="pc-card">
        <div className="pc-inside" aria-hidden="true" />
        <div className="pc-shine" aria-hidden="true" />
        <div className="pc-glare" aria-hidden="true" />
        <div className="pc-header">{header}</div>
        <div className="pc-media">{media}</div>
        <div className="pc-footer">{footer}</div>
      </section>
    </div>
  </div>;
}

const ProfileCard = memo(ProfileCardComponent);
export default ProfileCard;
