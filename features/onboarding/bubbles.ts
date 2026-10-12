/**
 * Motion for the onboarding background bubbles, modeled on Clavr's: slow drift along two
 * sine waves, small random nudges, soft bounces off the edges and off each other, and a
 * push away from the form so they float around it rather than behind it.
 * Pure functions with no DOM, so they can be tested. Speeds are in pixels per frame at 60fps.
 */

export interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  waveAmp: number;
  waveFreq: number;
  baseSpeed: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Field {
  /** Where bubbles may go. */
  bounds: Rect;
  /** An area they drift away from, like the form. */
  avoid: Rect | null;
}

/** A small seeded random generator, so tests are repeatable. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Spreads bubbles over an even grid with a little jitter, each heading a random way. */
export function createBubbles(sizes: readonly number[], field: Field, random: () => number = Math.random, speedScale = 1): Bubble[] {
  const { bounds } = field;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const cols = Math.max(1, Math.ceil(Math.sqrt(sizes.length * (width / Math.max(height, 1)))));
  const rows = Math.ceil(sizes.length / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  return sizes.map((size, i) => {
    const radius = size / 2;
    const x = bounds.left + cellW * ((i % cols) + 0.5) + (random() - 0.5) * cellW * 0.3;
    const y = bounds.top + cellH * (Math.floor(i / cols) + 0.5) + (random() - 0.5) * cellH * 0.3;
    const angle = random() * Math.PI * 2;
    const speed = (0.3 + random() * 0.25) * speedScale;
    return {
      x: clamp(x, bounds.left + radius, bounds.right - radius),
      y: clamp(y, bounds.top + radius, bounds.bottom - radius),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.6,
      radius,
      phase: random() * Math.PI * 2,
      waveAmp: (0.3 + random() * 0.3) * speedScale,
      waveFreq: 0.01 + random() * 0.01,
      baseSpeed: speed,
    };
  });
}

/** Advances every bubble one frame. Mutates in place: it runs 60 times a second. */
export function stepBubbles(bubbles: Bubble[], frame: number, field: Field, random: () => number = Math.random): void {
  const { bounds, avoid } = field;

  for (let i = 0; i < bubbles.length; i++) {
    const p = bubbles[i];

    // Two slow waves at different rates make the path curve naturally.
    const waveX = Math.sin(frame * p.waveFreq + p.phase) * p.waveAmp;
    const waveY = Math.cos(frame * p.waveFreq * 0.7 + p.phase + 1.3) * p.waveAmp * 0.8;
    p.x += p.vx + waveX * 0.3;
    p.y += p.vy + waveY * 0.25;
    p.vx *= 0.9995;
    p.vy *= 0.9995;

    // Never let a bubble stall.
    const speed = Math.hypot(p.vx, p.vy);
    const minSpeed = p.baseSpeed * 0.4;
    if (speed < minSpeed) {
      const angle = speed > 0.001 ? Math.atan2(p.vy, p.vx) : random() * Math.PI * 2;
      p.vx = Math.cos(angle) * minSpeed;
      p.vy = Math.sin(angle) * minSpeed;
    }

    // Every couple of seconds, a small random change of direction.
    if (frame % 120 === i % 120) {
      const nudge = (0.06 + random() * 0.04) * (p.baseSpeed / 0.4);
      p.vx += (random() - 0.5) * nudge;
      p.vy += (random() - 0.5) * nudge * 0.6;
      const capped = Math.hypot(p.vx, p.vy);
      const maxSpeed = p.baseSpeed * 1.3;
      if (capped > maxSpeed) {
        p.vx = (p.vx / capped) * maxSpeed;
        p.vy = (p.vy / capped) * maxSpeed;
      }
    }

    // Soft bounce off the edges.
    if (p.x - p.radius < bounds.left) {
      p.x = bounds.left + p.radius;
      p.vx = Math.abs(p.vx) * 0.85;
    } else if (p.x + p.radius > bounds.right) {
      p.x = bounds.right - p.radius;
      p.vx = -Math.abs(p.vx) * 0.85;
    }
    if (p.y - p.radius < bounds.top) {
      p.y = bounds.top + p.radius;
      p.vy = Math.abs(p.vy) * 0.85;
    } else if (p.y + p.radius > bounds.bottom) {
      p.y = bounds.bottom - p.radius;
      p.vy = -Math.abs(p.vy) * 0.85;
    }

    // Drift out of the area to avoid, toward its nearest side.
    if (avoid && p.x + p.radius > avoid.left && p.x - p.radius < avoid.right && p.y + p.radius > avoid.top && p.y - p.radius < avoid.bottom) {
      const toLeft = p.x - avoid.left;
      const toRight = avoid.right - p.x;
      p.vx += (toLeft < toRight ? -1 : 1) * 0.06;
      p.vy += (p.y < (avoid.top + avoid.bottom) / 2 ? -1 : 1) * 0.02;
    }

    // Keep bubbles spread out, and bounce them apart when they touch.
    for (let j = i + 1; j < bubbles.length; j++) {
      const q = bubbles[j];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const distSq = dx * dx + dy * dy;
      const minDist = p.radius + q.radius;
      const reach = minDist * 4;
      if (distSq >= reach * reach) continue;

      const dist = Math.sqrt(distSq) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      if (distSq < minDist * minDist) {
        const overlap = (minDist - dist) / 2;
        p.x -= nx * overlap;
        p.y -= ny * overlap;
        q.x += nx * overlap;
        q.y += ny * overlap;
        const closing = p.vx * nx + p.vy * ny - (q.vx * nx + q.vy * ny);
        if (closing > 0) {
          p.vx -= closing * nx * 0.5;
          p.vy -= closing * ny * 0.5;
          q.vx += closing * nx * 0.5;
          q.vy += closing * ny * 0.5;
        }
      } else {
        const strength = (1 - dist / reach) * 0.015;
        p.vx -= nx * strength;
        p.vy -= ny * strength;
        q.vx += nx * strength;
        q.vy += ny * strength;
      }
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
