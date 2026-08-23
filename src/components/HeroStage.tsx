"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * صحنه سه‌بعدی سربرگ.
 *
 * محتوا روی یک صفحه با پرسپکتیو می‌نشیند و با حرکت نشانگر کمی می‌چرخد، طوری
 * که انگار از صفحه بیرون زده است. چرخش عمدی کم است — زاویه زیاد، طرح را
 * کج و ارزان نشان می‌دهد.
 *
 * روی صفحه لمسی و با prefers-reduced-motion فقط زاویه ثابت می‌ماند و
 * هیچ حرکتی اجرا نمی‌شود.
 */

const BASE_ROTATE_Y = -9;
const BASE_ROTATE_X = 4;
const RANGE_Y = 5;
const RANGE_X = 2.5;

export function HeroStage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const nx = (event.clientX / window.innerWidth - 0.5) * 2;
        const ny = (event.clientY / window.innerHeight - 0.5) * 2;
        el.style.transform =
          `perspective(1400px) rotateY(${BASE_ROTATE_Y + nx * RANGE_Y}deg) ` +
          `rotateX(${BASE_ROTATE_X - ny * RANGE_X}deg)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `perspective(1400px) rotateY(${BASE_ROTATE_Y}deg) rotateX(${BASE_ROTATE_X}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 300ms cubic-bezier(0.22, 0.8, 0.3, 1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
