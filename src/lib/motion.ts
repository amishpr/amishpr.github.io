/* Browser helpers for animation. Safe to import on the server: nothing touches window until called. */
import { useEffect, useRef } from "react";

export const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const money = (n: number, sign = false) =>
  (sign && n > 0 ? "+" : n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, reduced() ? 0 : ms));

export const ease = {
  out: (p: number) => 1 - Math.pow(1 - p, 3),
  inOut: (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  lin: (p: number) => p,
};

/* Calls fn(progress 0..1) every frame for ms milliseconds. Reduced motion jumps straight to 1. */
export function tween(ms: number, fn: (p: number) => void, e = ease.out): Promise<void> {
  return new Promise((res) => {
    if (reduced() || ms <= 0) { fn(1); return res(); }
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      fn(e(p));
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

/* Runs a frame loop until fn(elapsedMs) returns true. Reduced motion calls fn(Infinity) once. */
export function frames(fn: (t: number) => boolean): Promise<void> {
  return new Promise((res) => {
    if (reduced()) { fn(Infinity); return res(); }
    const t0 = performance.now();
    const step = (now: number) => (fn(now - t0) ? res() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
}

export function onFirstView(el: Element, fn: () => void, threshold = 0.35): () => void {
  if (!("IntersectionObserver" in window)) { fn(); return () => {}; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((en) => en.isIntersecting)) { io.disconnect(); fn(); }
  }, { threshold });
  io.observe(el);
  return () => io.disconnect();
}

/* Ref for an element; fn runs once, the first time it scrolls into view. */
export function useFirstView<T extends Element>(fn: () => void, threshold = 0.35) {
  const ref = useRef<T>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => (ref.current ? onFirstView(ref.current, () => fnRef.current(), threshold) : undefined), [threshold]);
  return ref;
}

/* Page-wide: fades [data-reveal] in on scroll and counts [data-count] figures up from 0. Static markup only. */
export function usePageMotion() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]:not(.is-in)");
    const counts = document.querySelectorAll<HTMLElement>("[data-count]");
    if (reduced() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
    const stops = [...counts].map((el) => {
      const v = Number(el.dataset.count), suf = el.dataset.suffix || "";
      el.textContent = "0";
      return onFirstView(el, () => tween(1500, (p) => (el.textContent = fmt(v * p) + (p >= 1 ? suf : ""))), 0.6);
    });
    return () => { io.disconnect(); stops.forEach((s) => s()); };
  }, []);
}

/* A number that animates whenever `value` changes (from `start` on mount, if given).
   Render `initial` as the element's only child; after that the text is written directly, so frames don't re-render. */
export function useTweenText<T extends HTMLElement>(value: number, format: (n: number) => string, ms: number, start = value) {
  const ref = useRef<T>(null);
  const shown = useRef(start);
  const initial = useRef(format(start)).current;
  useEffect(() => {
    const a = shown.current;
    if (a === value) return;
    let live = true;
    tween(ms, (p) => {
      if (!live) return;
      shown.current = a + (value - a) * p;
      if (ref.current) ref.current.textContent = format(shown.current);
    });
    return () => { live = false; };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, initial] as const;
}
