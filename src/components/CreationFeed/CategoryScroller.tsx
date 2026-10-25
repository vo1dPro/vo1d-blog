import type { CreationLayout } from "@/services/creations/model";
import { animate, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

const compactQuery = "(max-width: 1100px)";
const subscribeCompact = (notify: () => void) => {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const getCompact = () => window.matchMedia(compactQuery).matches;

interface Props {
  categories: CreationLayout["categories"];
  value: string;
  onChange: (id: string) => void;
}

const wrap = (index: number, count: number) =>
  ((index % count) + count) % count;

export default function CategoryScroller({
  categories,
  value,
  onChange,
}: Props) {
  const reducedMotion = useReducedMotion();
  const horizontal = useSyncExternalStore(subscribeCompact, getCompact, () => false);
  const options = [{ id: "all", name: "All" }, ...categories];
  const labelKey = JSON.stringify(options.map(option => option.name));
  const selected = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );
  const [position, setPosition] = useState(selected);
  const current = useRef(selected);
  const target = useRef(selected);
  const [impact, setImpact] = useState({ arrow: 0, text: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    id: number;
    startCoordinate: number;
    horizontal: boolean;
    start: number;
    step: number;
    moved: boolean;
  } | null>(null);
  const wheel = useRef({ amount: 0, time: 0 });
  const suppressClick = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const controls = useRef<{ stop: () => void }[]>([]);
  const buttons = useRef(new Map<number, HTMLButtonElement>());

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || !horizontal) return;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    const labels: string[] = JSON.parse(labelKey);
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const button = element.querySelector("button");
      if (!button) return;
      element.style.removeProperty("--category-label-size");
      const style = getComputedStyle(button);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const textWidth = Math.max(...labels.map(label => context.measureText(label).width));
      const available = Math.max(1, element.clientWidth * 0.76);
      const baseStep = parseFloat(getComputedStyle(element.parentElement!).getPropertyValue("--category-step")) || 90;
      const step = Math.min(available, Math.max(baseStep, Math.ceil(textWidth + 24)));
      element.style.setProperty("--category-step", `${step}px`);
      if (textWidth > step - 24) {
        element.style.setProperty("--category-label-size", `${parseFloat(style.fontSize) * (step - 24) / textWidth}px`);
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      observer.disconnect();
      element.style.removeProperty("--category-step");
      element.style.removeProperty("--category-label-size");
    };
  }, [horizontal, labelKey]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const preventPageScroll = (event: WheelEvent) => {
      if (!horizontal || Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.preventDefault();
    };
    element.addEventListener("wheel", preventPageScroll, { passive: false });
    return () => {
      element.removeEventListener("wheel", preventPageScroll);
    };
  }, [horizontal]);
  useEffect(() => () => {
    controls.current.forEach((control) => control.stop());
  }, []);

  const paint = (next: number) => {
    current.current = next;
    setPosition(next);
  };
  const interrupt = () => {
    controls.current.forEach((control) => control.stop());
    controls.current = [];
    setImpact({ arrow: 0, text: 0 });
  };
  const select = (next: number, focus = false, poke = true) => {
    interrupt();
    target.current = next;
    const finish = () => {
      onChange(options[wrap(next, options.length)].id);
      if (focus) buttons.current.get(next)?.focus({ preventScroll: true });
      if (reducedMotion || !poke) return;
      // The arrow leads; the text reacts after contact, then rebounds.
      controls.current = [
        animate(0, [0, 20, 0], {
          duration: 0.22,
          times: [0, 0.25, 1],
          onUpdate: (arrow) =>
            setImpact((previous) => ({ ...previous, arrow })),
        }),
        animate(0, [0, 10, -2, 0], {
          delay: 0.005,
          duration: 0.36,
          times: [0, 0.22, 0.65, 1],
          onUpdate: (text) => setImpact((previous) => ({ ...previous, text })),
        }),
      ];
    };
    if (reducedMotion) {
      paint(next);
      finish();
      return;
    }
    controls.current = [
      animate(current.current, next, {
        duration: 0.34,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: paint,
        onComplete: finish,
      }),
    ];
  };
  const cancelDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    select(target.current, false, false);
  };
  // Stable unbounded slots enter and leave beyond the mask; no visible wrap jump.
  const base = Math.floor(position);
  const slots = Array.from({ length: 15 }, (_, index) => base + index - 7);

  return (
    <nav className="creation-category-scroller" aria-label="动态分类">
      <div
        ref={viewport}
        className="creation-category-wheel"
        data-lenis-prevent={horizontal ? undefined : true}
        data-orientation={horizontal ? "horizontal" : "vertical"}
        data-position={position}
        data-dragging={dragging || undefined}
        onWheel={(event) => {
          if (drag.current) return;
          if (horizontal && Math.abs(event.deltaY) >= Math.abs(event.deltaX)) return;
          if (event.timeStamp - wheel.current.time > 180)
            wheel.current.amount = 0;
          wheel.current.time = event.timeStamp;
          const delta =
            (horizontal ? event.deltaX : event.deltaY) *
            (event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? event.currentTarget.clientHeight
                : 1);
          if (Math.sign(delta) !== Math.sign(wheel.current.amount))
            wheel.current.amount = 0;
          wheel.current.amount += delta;
          const steps = Math.trunc(wheel.current.amount / 60);
          if (!steps) return;
          wheel.current.amount -= steps * 60;
          select(target.current + Math.max(-3, Math.min(3, steps)));
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || drag.current) return;
          suppressClick.current = false;
          interrupt();
          drag.current = {
            id: event.pointerId,
            startCoordinate: horizontal ? event.clientX : event.clientY,
            horizontal,
            start: current.current,
            step:
              parseFloat(
                getComputedStyle(event.currentTarget).getPropertyValue(
                  "--category-step",
                ),
              ) || 56,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          if (gesture.horizontal !== horizontal) { cancelDrag(); return; }
          const delta = (horizontal ? event.clientX : event.clientY) - gesture.startCoordinate;
          if (!gesture.moved && Math.abs(delta) < 6) return;
          if (!gesture.moved) {
            gesture.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            suppressClick.current = true;
            setDragging(true);
          }
          paint(gesture.start - delta / gesture.step);
        }}
        onPointerUp={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          drag.current = null;
          setDragging(false);
          if (gesture.moved) select(Math.round(current.current));
          else select(target.current, false, false);
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onLostPointerCapture={(event) => {
          if (event.target === event.currentTarget) cancelDrag();
        }}
        onPointerCancel={cancelDrag}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onKeyDown={(event) => {
          const cycle =
            Math.floor(target.current / options.length) * options.length;
          const next =
            event.key === (horizontal ? "ArrowRight" : "ArrowDown")
              ? target.current + 1
              : event.key === (horizontal ? "ArrowLeft" : "ArrowUp")
                ? target.current - 1
                : event.key === "Home"
                  ? cycle
                  : event.key === "End"
                    ? cycle + options.length - 1
                    : null;
          if (next === null) return;
          event.preventDefault();
          select(next, true);
        }}
      >
        <span
          className="creation-category-arrow"
          aria-hidden="true"
          style={{ transform: horizontal ? `translateY(${impact.arrow * 0.45}px) rotate(90deg)` : `translateX(${impact.arrow}px)` }}
        >
          <svg viewBox="0 0 40 40" fill="none" focusable="false">
            <path
              d="M4 20H34M21 7L34 20L21 33"
              stroke="currentColor"
              strokeWidth="4.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        </span>
        {slots.map((slot) => {
          const index = wrap(slot, options.length);
          const option = options[index];
          const offset = slot - position;
          const distance = Math.abs(offset);
          const angle = (offset * 7 * Math.PI) / 180;
          const nearestCopy =
            slot ===
            index +
              Math.round((position - index) / options.length) * options.length;
          const active = nearestCopy && index === selected;
          const bump = slot === Math.round(position) ? impact.text : 0;
          return (
            <button
              key={slot}
              ref={(element) => {
                if (element) buttons.current.set(slot, element);
                else buttons.current.delete(slot);
              }}
              type="button"
              aria-hidden={!nearestCopy || undefined}
              aria-pressed={active}
              tabIndex={active ? 0 : -1}
              data-slot={slot}
              aria-controls="creation-feed-results"
              title={option.name}
              style={{
                transform: horizontal
                  ? `translate(${offset * 100}%, ${bump * 0.5}px)`
                  : `translate(${600 * (Math.cos(angle) - 1) + bump}px, ${(Math.sin(angle) / Math.sin((7 * Math.PI) / 180)) * 100}%) rotate(${reducedMotion ? 0 : offset * 7}deg)`,
                opacity:
                  Math.max(0, Math.min(1, 6 - distance)) *
                  (0.2 + 0.8 * Math.exp(-distance * 1.6)),
                filter: `blur(${reducedMotion ? 0 : Math.min(distance, 7) ** 1.55 * 0.72}px)`,
                pointerEvents: distance > 5.5 ? "none" : "auto",
              }}
              onClick={() => select(slot, true)}
            >
              {option.name}
            </button>
          );
        })}
      </div>
      <span className="creation-category-announcement" role="status">
        当前分类：{options[selected].name}
      </span>
    </nav>
  );
}
