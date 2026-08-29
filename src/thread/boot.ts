// Decides whether the thread runs at all, and loads it only after the page has painted, so the
// headline is always the first thing on screen. Without it the page is complete: the same HTML
// reads as an ordinary document (see the "Without the thread" styles in Thread.astro).

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export function bootThread() {
  const params = new URLSearchParams(location.search);
  const forced = params.has("thread") || params.has("debug");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (params.has("nothread") || !("WebGL2RenderingContext" in window)) return;
  if (!forced && (reduced || saveData)) return;

  const go = () => {
    import("./main")
      .then((m) => m.startThread())
      .catch((err) => console.error("[thread]", err));
  };
  const w = window as IdleWindow;
  const idle = () => (w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 700 }) : setTimeout(go, 200));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}
