import { describe, expect, it } from "vitest";

import { createBubbles, seededRandom, stepBubbles, type Field } from "./bubbles";

const FIELD: Field = { bounds: { left: 0, top: 0, right: 1200, bottom: 800 }, avoid: null };
const SIZES = [40, 48, 56, 64, 44, 52, 60, 36];

function run(field: Field, frames: number, seed = 1) {
  const random = seededRandom(seed);
  const bubbles = createBubbles(SIZES, field, random);
  for (let frame = 0; frame < frames; frame++) stepBubbles(bubbles, frame, field, random);
  return bubbles;
}

describe("background bubbles", () => {
  it("stay on screen and never stall", () => {
    const bubbles = run(FIELD, 3000);
    for (const b of bubbles) {
      expect(b.x - b.radius).toBeGreaterThanOrEqual(-1);
      expect(b.x + b.radius).toBeLessThanOrEqual(1201);
      expect(b.y - b.radius).toBeGreaterThanOrEqual(-1);
      expect(b.y + b.radius).toBeLessThanOrEqual(801);
      expect(Math.hypot(b.vx, b.vy)).toBeGreaterThan(0);
    }
  });

  it("don't end up stacked on each other", () => {
    const bubbles = run(FIELD, 3000);
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const gap = Math.hypot(bubbles[i].x - bubbles[j].x, bubbles[i].y - bubbles[j].y);
        expect(gap).toBeGreaterThan((bubbles[i].radius + bubbles[j].radius) * 0.9);
      }
    }
  });

  it("drift out of the area they should avoid", () => {
    const avoid = { left: 400, top: 0, right: 800, bottom: 800 };
    const bubbles = run({ ...FIELD, avoid }, 4000);
    const inside = bubbles.filter((b) => b.x > avoid.left + b.radius && b.x < avoid.right - b.radius);
    expect(inside.length).toBeLessThanOrEqual(1);
  });
});
