// Loads the thread only after the page has painted, so the headline is always the first thing on
// screen. Without it the page is complete: the same HTML reads as an ordinary document (see the "Without the thread" styles in Thread.astro).

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

/** If the thread hasn't started by then (a stalled network), the page settles as a document. */
const GIVE_UP_MS = 10000;

export function bootThread() {
  const root = document.documentElement;
  // The head script (Home.astro) has already decided, before the first paint, and put the page in
  // the thread's layout; the gates (reduced motion, Save-Data, `?nothread`, no WebGL2) live there.
  if (!root.classList.contains("thread-on")) return;

  let settled = false;
  const fallBack = () => {
    settled = true;
    root.classList.remove("thread-on", "thread-ready");
  };
  const giveUp = setTimeout(fallBack, GIVE_UP_MS);

  const go = () => {
    if (settled) return;
    clearTimeout(giveUp);
    settled = true;
    import("./main")
      .then((m) => m.startThread())
      .then((handle) => handle ?? fallBack())
      .catch((err) => {
        console.error("[thread]", err);
        fallBack();
      });
  };
  const w = window as IdleWindow;
  const idle = () => (w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 700 }) : setTimeout(go, 200));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}
