// Keeps the HTML in step with the thread:
// - panels reveal on their cues (CSS reads one `--v` per panel and staggers the words itself),
// - mono kickers decode once when their panel arrives,
// - counters climb with their cue,
// - labels follow points of the figures,
// - planes (the app screenshot) are mapped into the 3D scene with a CSS matrix3d.
// Only writes styles, never reads layout per frame.
//
// Everything stays readable while it waits for its cue: an element outside its cue gets
// `data-off` (opacity 0, links unclickable), never `visibility: hidden`, so screen readers, the Tab
// key and find-in-page reach all of it. Animated text (split words, decoding kickers, counters)
// plays on an aria-hidden copy; the real text stays beside it, visually hidden.

import { multiply, mat4, project, cross, normalize, type Mat4, type Vec3 } from "./math";
import type { Plane } from "./stations/kit";
import { CUES, PANELS, cue, visibility, type PanelId } from "./timeline";

interface PanelEl {
  el: HTMLElement;
  id: PanelId;
  v: number;
  scramble: { el: HTMLElement; text: string; start: number }[];
}

interface AnchorEl {
  el: HTMLElement;
  id: string;
  cue: PanelId;
  x: number;
  y: number;
  v: number;
  left: boolean;
}

interface PlaneEl {
  el: HTMLElement;
  id: string;
  cue: PanelId;
  v: number;
  w: number;
  h: number;
  /** Its lazy image has been asked to load. */
  primed: boolean;
}

interface CounterEl {
  el: HTMLElement;
  cue: keyof typeof CUES;
  to: number;
  shown: string;
  /** The server-rendered text, which the counter ends on. */
  text: string;
}

const isPanel = (id: string): id is PanelId => id in PANELS;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+#";
const SCRAMBLE_MS = 700;
/** How long before its cue a plane's image starts loading, in beats (viewport heights). */
const PRIME_BEATS = 1.5;
/** Counters format like the server-rendered text: "1,000" in English, "1.000" in German. */
const fmt = new Intl.NumberFormat(document.documentElement.lang || "en");

/**
 * Splits `el`'s text in two: the real text, visually hidden, for assistive technology and
 * find-in-page; and an aria-hidden copy that the animations may split, scramble or count up.
 * Returns the copy.
 */
function twin(el: HTMLElement): HTMLElement {
  const existing = el.querySelector<HTMLElement>(":scope > [data-copy]");
  if (existing) return existing;
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const real = document.createElement("span");
  real.className = "visually-hidden";
  real.textContent = text;
  const copy = document.createElement("span");
  copy.setAttribute("aria-hidden", "true");
  copy.dataset.copy = "";
  copy.textContent = text;
  el.replaceChildren(real, copy);
  return copy;
}

/** Wraps each word of `el` in spans the CSS can stagger (on its aria-hidden copy). */
function splitWords(el: HTMLElement) {
  if (el.dataset.split) return;
  el.dataset.split = "1";
  const copy = twin(el);
  const words = (copy.textContent ?? "").split(" ");
  copy.textContent = "";
  words.forEach((word, i) => {
    const outer = document.createElement("span");
    outer.className = "w";
    const inner = document.createElement("span");
    inner.textContent = word;
    inner.style.setProperty("--i", String(i));
    outer.append(inner);
    copy.append(outer, i < words.length - 1 ? " " : "");
  });
}

/** Marks an element as outside its cue: invisible and unclickable, but still in the page. */
const setOff = (el: HTMLElement, off: boolean) => el.toggleAttribute("data-off", off);

export class DomSync {
  private panels: PanelEl[] = [];
  private anchors: AnchorEl[] = [];
  private planes: PlaneEl[] = [];
  private counters: CounterEl[] = [];
  private m = mat4();
  private tmp = mat4();
  private screen = mat4();

  constructor(
    root: ParentNode,
    private points: () => Record<string, Vec3>,
    private planeDefs: () => Record<string, Plane>,
    /** False for still renders: text appears without decoding. */
    private animate = true
  ) {
    root.querySelectorAll<HTMLElement>("[data-cue]").forEach((el) => {
      const id = el.dataset.cue!;
      if (!isPanel(id)) return;
      if (el.dataset.anchor) {
        if (el.hasAttribute("data-words")) splitWords(el);
        el.querySelectorAll<HTMLElement>("[data-words]").forEach(splitWords);
        this.anchors.push({ el, id: el.dataset.anchor, cue: id, x: NaN, y: NaN, v: -1, left: false });
      } else if (el.dataset.plane) {
        this.planes.push({ el, id: el.dataset.plane, cue: id, v: -1, w: 1, h: 1, primed: false });
      } else {
        el.querySelectorAll<HTMLElement>("[data-words]").forEach(splitWords);
        const scramble = Array.from(el.querySelectorAll<HTMLElement>("[data-scramble]")).map((s) => {
          const copy = twin(s);
          return { el: copy, text: copy.textContent ?? "", start: -1 };
        });
        this.panels.push({ el, id, v: -1, scramble });
      }
    });
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const c = el.dataset.count as keyof typeof CUES;
      if (!(c in CUES)) return;
      const copy = twin(el);
      const text = copy.textContent ?? "";
      this.counters.push({ el: copy, cue: c, to: Number(el.dataset.countTo) || 0, shown: "", text });
    });
    this.measure();
  }

  /** The cue of the panel or label that contains `node`, if any. */
  cueOf(node: Node | null): PanelId | null {
    const el = node instanceof Element ? node : node?.parentElement;
    const id = el?.closest<HTMLElement>("[data-cue]")?.dataset.cue;
    return id && isPanel(id) ? id : null;
  }

  /** The text panel most on screen right now (to find it again in the document version). */
  mostVisible(): HTMLElement | null {
    let best: PanelEl | null = null;
    for (const p of this.panels) if (p.v > 0 && (!best || p.v > best.v)) best = p;
    return best?.el ?? null;
  }

  /** True while a kicker is still decoding (the loop must keep drawing). */
  get busy() {
    return this.panels.some((p) => p.scramble.some((s) => s.start >= 0));
  }

  /**
   * Undoes everything written here, so the same markup reads as a document again: inline styles,
   * `data-off`, the label sides, and the final text in every counter and kicker.
   */
  reset() {
    for (const p of this.panels) {
      p.el.style.removeProperty("--v");
      setOff(p.el, false);
      p.v = -1;
      for (const s of p.scramble) {
        s.el.textContent = s.text;
        s.start = -1;
      }
    }
    for (const c of this.counters) {
      c.el.textContent = c.text;
      c.shown = "";
    }
    for (const a of this.anchors) {
      for (const prop of ["--v", "opacity", "transform"]) a.el.style.removeProperty(prop);
      setOff(a.el, false);
      a.el.classList.remove("label--left");
      Object.assign(a, { v: -1, x: NaN, y: NaN, left: false });
    }
    for (const p of this.planes) {
      for (const prop of ["--v", "transform"]) p.el.style.removeProperty(prop);
      setOff(p.el, false);
      p.v = -1;
    }
  }

  /** Element sizes for the planes; call on resize. */
  measure() {
    for (const p of this.planes) {
      p.w = p.el.offsetWidth || 1;
      p.h = p.el.offsetHeight || 1;
    }
  }

  update(t: number, now: number, viewProj: Mat4, width: number, height: number) {
    for (const p of this.panels) {
      const v = Math.round(visibility(t, PANELS[p.id]) * 1000) / 1000;
      if (v !== p.v) {
        if (p.v <= 0 && v > 0 && this.animate) for (const s of p.scramble) s.start = now;
        p.v = v;
        p.el.style.setProperty("--v", String(v));
        setOff(p.el, v === 0);
      }
      for (const s of p.scramble) this.scramble(s, now);
    }

    for (const c of this.counters) {
      const text = fmt.format(Math.round(c.to * cue(t, CUES[c.cue])));
      if (text !== c.shown) {
        c.shown = text;
        c.el.textContent = text;
      }
    }

    const pts = this.points();
    for (const a of this.anchors) {
      const point = pts[a.id];
      if (!point) continue;
      const c = project(viewProj, point);
      const inFront = c[3] > 0.2;
      let v = inFront ? visibility(t, PANELS[a.cue]) : 0;
      v = Math.round(v * 100) / 100;
      if (v > 0) {
        const x = Math.round(((c[0] / c[3]) * 0.5 + 0.5) * width * 2) / 2;
        const y = Math.round((1 - ((c[1] / c[3]) * 0.5 + 0.5)) * height * 2) / 2;
        if (x !== a.x || y !== a.y) {
          a.x = x;
          a.y = y;
          a.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        // Near the right edge the text goes to the left of its dot, so it never runs off screen.
        const left = x > width * 0.68 && !a.el.dataset.fixedSide;
        if (left !== a.left) {
          a.left = left;
          a.el.classList.toggle("label--left", left);
        }
      }
      if (v !== a.v) {
        a.v = v;
        a.el.style.opacity = String(Math.min(1, v * 1.6));
        a.el.style.setProperty("--v", String(v));
        setOff(a.el, v === 0);
      }
    }

    const defs = this.planeDefs();
    for (const p of this.planes) {
      const def = defs[p.id];
      if (!def) continue;
      // A plane waits off screen (Thread.astro), so its lazy image doesn't load with the page;
      // it starts loading a little before its cue.
      if (!p.primed && t > PANELS[p.cue][0] - PRIME_BEATS) {
        p.primed = true;
        p.el.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
      }
      const centre = project(viewProj, def.center);
      const v = centre[3] > 1 ? Math.round(visibility(t, PANELS[p.cue]) * 100) / 100 : 0;
      if (v !== p.v) {
        p.v = v;
        p.el.style.setProperty("--v", String(v));
        setOff(p.el, v === 0);
      }
      if (v > 0) p.el.style.transform = this.planeMatrix(def, p.w, p.h, viewProj, width, height);
    }
  }

  /** A CSS matrix3d that maps an element of w × h px onto `plane` as the camera sees it. */
  private planeMatrix(plane: Plane, w: number, h: number, viewProj: Mat4, width: number, height: number) {
    const { center, right, up } = plane;
    const sx = plane.width / w;
    const sy = plane.height / h;
    const normal = normalize(cross(right, up));
    const corner: Vec3 = [
      center[0] - right[0] * (plane.width / 2) + up[0] * (plane.height / 2),
      center[1] - right[1] * (plane.width / 2) + up[1] * (plane.height / 2),
      center[2] - right[2] * (plane.width / 2) + up[2] * (plane.height / 2),
    ];
    // Element px → world.
    const model = mat4();
    model.set([
      right[0] * sx, right[1] * sx, right[2] * sx, 0,
      -up[0] * sy, -up[1] * sy, -up[2] * sy, 0,
      normal[0] * 0.001, normal[1] * 0.001, normal[2] * 0.001, 0,
      corner[0], corner[1], corner[2], 1,
    ]);
    // Clip space → CSS px (y down).
    const s = this.screen;
    s.set([width / 2, 0, 0, 0, 0, -height / 2, 0, 0, 0, 0, 1, 0, width / 2, height / 2, 0, 1]);
    multiply(this.tmp, viewProj, model);
    multiply(this.m, s, this.tmp);
    return `matrix3d(${Array.from(this.m, (n) => n.toFixed(6)).join(",")})`;
  }

  private scramble(s: { el: HTMLElement; text: string; start: number }, now: number) {
    if (s.start < 0) return;
    const k = (now - s.start) / SCRAMBLE_MS;
    if (k >= 1) {
      s.el.textContent = s.text;
      s.start = -1;
      return;
    }
    const n = s.text.length;
    let out = "";
    for (let i = 0; i < n; i++) {
      const ch = s.text[i];
      const settle = (i / n) * 0.7 + 0.25;
      out += k >= settle || ch === " " || ch === "·" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    s.el.textContent = out;
  }
}
