import { Component, lazy, Suspense, useState } from 'react';
import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

// three.js is large, so the fluid effect loads in its own chunk after the page is interactive.
const LiquidEther = lazy(() => import('./LiquidEther'));

// Module-level so the reference is stable: a new array would rebuild the WebGL simulation.
const COLORS = ['#ffd1da', '#ff8fa3', '#ff385c'];

class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

/** Soft, light fluid backdrop behind the page; purely decorative and never blocks input. */
export default function AnimatedBackground() {
  const reduce = useReducedMotion();
  const [supported] = useState(() => typeof document !== 'undefined' && supportsWebGL());
  if (reduce || !supported) return null;
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-45">
    <SilentBoundary>
      <Suspense fallback={null}>
        <LiquidEther
          colors={COLORS}
          lightMode
          backgroundColor="#ffffff"
          mouseForce={18}
          cursorSize={90}
          isViscous={false}
          iterationsPoisson={16}
          resolution={0.35}
          isBounce={false}
          autoDemo
          autoSpeed={0.35}
          autoIntensity={1.8}
          takeoverDuration={0.25}
          autoResumeDelay={2500}
          autoRampDuration={0.8}
        />
      </Suspense>
    </SilentBoundary>
  </div>;
}
