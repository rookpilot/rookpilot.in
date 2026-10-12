"use client";

import {
  AlarmSmoke,
  Droplets,
  Fan,
  Flame,
  House,
  KeyRound,
  Leaf,
  Lightbulb,
  ShowerHead,
  Snowflake,
  Sprout,
  Wind,
  Wrench,
  Refrigerator,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

import { createBubbles, stepBubbles, type Field } from "../bubbles";

/** Things Rookpilot keeps track of. Hovering a bubble shows its name. */
const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: AlarmSmoke, label: "Smoke alarm" },
  { icon: Wind, label: "Air filter" },
  { icon: Droplets, label: "Water heater" },
  { icon: Leaf, label: "Gutters" },
  { icon: Flame, label: "Furnace" },
  { icon: Snowflake, label: "AC" },
  { icon: KeyRound, label: "Locks" },
  { icon: Fan, label: "Exhaust fan" },
  { icon: Lightbulb, label: "Lighting" },
  { icon: Wrench, label: "Repairs" },
  { icon: ShowerHead, label: "Caulk and grout" },
  { icon: Refrigerator, label: "Fridge filter" },
  { icon: Sprout, label: "Garden" },
  { icon: Hammer, label: "Projects" },
  { icon: House, label: "Roof" },
];

/** Clavr's mix of sizes: 36–68px, or 22–34px on phones. */
function bubbleSize(index: number, phone: boolean): number {
  return phone ? 22 + (index % 4) * 4 : 36 + (index % 5) * 8;
}

/** Element the bubbles steer around: the step's content column. */
export const BUBBLE_AVOID_ATTRIBUTE = "data-bubbles-avoid";

/**
 * Small glossy bubbles that wander around onboarding, like Clavr's: they curve, bounce
 * off the edges and each other, and keep clear of the form. On phones they sit behind the
 * text in a strip at the top; on wide screens they float above the page so hovering shows a name. Decorative only: hidden from
 * screen readers, and slower for people who prefer reduced motion.
 */
export function FloatingBubbles() {
  const layer = useRef<HTMLDivElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const phone = useMediaQuery("(max-width: 767px)");
  const count = phone ? 8 : ITEMS.length;

  useEffect(() => {
    const root = layer.current;
    if (!root) return;
    const nodes = Array.from(root.children) as HTMLElement[];
    const sizes = Array.from({ length: count }, (_, i) => bubbleSize(i, phone));

    // Phones get a thin strip at the top; wide screens get everything between the header and footer.
    const field = (): Field => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const target = document.querySelector(`[${BUBBLE_AVOID_ATTRIBUTE}]`)?.getBoundingClientRect();
      if (phone) return { bounds: { left: 12, top: 60, right: w - 12, bottom: Math.max(h * 0.16, 130) }, avoid: null };
      return {
        bounds: { left: 24, top: 72, right: w - 24, bottom: h - 96 },
        avoid: target ? { left: target.left - 32, top: target.top - 24, right: target.right + 32, bottom: target.bottom + 24 } : null,
      };
    };

    let current = field();
    // About twice Clavr's pace, so they read as moving rather than parked. When the system asks
    // for reduced motion they still drift, but calmer (about half the speed).
    const pace = reduceMotion ? 1.2 : phone ? 1.2 : 2;
    const bubbles = createBubbles(sizes, current, Math.random, pace);
    let frame = 0;
    let animation = 0;

    const paint = () => {
      const avoid = current.avoid;
      bubbles.forEach((b, i) => {
        const node = nodes[i];
        node.style.transform = `translate3d(${b.x - b.radius}px, ${b.y - b.radius}px, 0)`;
        // Never block the form, even while drifting out of its way.
        const overForm = avoid && b.x + b.radius > avoid.left && b.x - b.radius < avoid.right && b.y + b.radius > avoid.top && b.y - b.radius < avoid.bottom;
        node.style.pointerEvents = overForm ? "none" : "auto";
      });
    };

    const tick = () => {
      frame++;
      // Re-measure now and then: the form changes height between steps.
      if (frame % 30 === 0) current = field();
      stepBubbles(bubbles, frame, current);
      paint();
      animation = requestAnimationFrame(tick);
    };

    // Settle the starting layout before showing it, so no bubble begins over the form.
    for (let i = 0; i < 400; i++) stepBubbles(bubbles, ++frame, current);
    paint();
    root.style.opacity = "1";

    const onResize = () => (current = field());
    window.addEventListener("resize", onResize);
    animation = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", onResize);
    };
  }, [count, phone, reduceMotion]);

  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-0 transition-opacity duration-700 md:z-10">
      {ITEMS.slice(0, count).map(({ icon: Icon, label }, i) => {
        const size = bubbleSize(i, phone);
        return (
          <div key={label} className="group absolute top-0 left-0 will-change-transform" style={{ width: size, height: size }}>
            <div
              className="flex size-full items-center justify-center rounded-full border border-black/[0.06] text-muted-foreground/50 transition-transform duration-300 ease-out group-hover:scale-110 dark:border-white/[0.06] dark:text-muted-foreground/35"
              style={{
                background: "radial-gradient(circle at 30% 28%, var(--bubble-hi) 0%, var(--bubble-lo) 70%)",
                boxShadow: "inset 3px 3px 6px var(--bubble-shine), inset -3px -3px 6px rgb(0 0 0 / 0.05), 0 4px 14px rgb(0 0 0 / 0.07)",
              }}
            >
              <Icon style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={1.6} />
            </div>
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 translate-y-1 scale-90 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-foreground opacity-0 shadow-md transition-all duration-200 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
