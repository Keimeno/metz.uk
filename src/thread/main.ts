// The thread, put together: canvas, scroll timeline, camera, renderer, sparks, DOM sync and the
// frame-time watchdog, in one loop that only runs while the page is visible.
//
// All sizes come from the canvas itself, which is fixed at the *large* viewport height (100lvh).
// On phones that size never changes while the browser's toolbars slide in and out, so nothing
// re-lays out or reallocates mid-scroll, and the HTML labels and the picture always agree.

import { CameraRig, type Rect } from "./camera";
import { Chrome } from "./chrome";
import { loadZenarios } from "./data/zenarios";
import { createContext } from "./gl/gl";
import { E, clamp, smoothstep } from "./math";
import { FrameMonitor, detectTier, quality } from "./quality";
import { Renderer } from "./renderer";
import { ScrollTimeline } from "./scroll";
import { Sparks } from "./sparks";
import { Scene } from "./scene";
import { fanState } from "./stations/zenarios";
import { DomSync } from "./sync";
import { CUES, cue, stationStart, type StationId } from "./timeline";

const WRITE_DELAY = 350;
const WRITE_DURATION = 2400;
const GLINT_DURATION = 1500;

export interface ThreadHandle {
  stop(): void;
}

/** The share of the font size that a capital letter is tall, measured from the font itself. */
function capHeight(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 0.71;
  ctx.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
  const m = ctx.measureText("H");
  return m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent / 100 : 0.71;
}

/**
 * Where a reader is in the document version of the page: in a station (other than the intro), or
 * below the stations, `below` px under the end of the last one.
 */
function readingPlace(sections: HTMLElement[]): { station?: StationId; below?: number } | null {
  const line = window.innerHeight * 0.3;
  for (const el of sections) {
    if (el.getBoundingClientRect().bottom > line) {
      const id = el.dataset.station as StationId;
      return id === "intro" ? null : { station: id };
    }
  }
  return { below: sections[sections.length - 1].getBoundingClientRect().bottom };
}

export async function startThread(): Promise<ThreadHandle | null> {
  const params = new URLSearchParams(location.search);
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-station]"));
  const nameEl = document.querySelector<HTMLElement>("[data-name]");
  if (!sections.length || !nameEl) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "thread-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const caps = createContext(canvas);
  if (!caps) return null;

  // Normally the page is in the thread's layout from the first paint (Home.astro). If it has been
  // an ordinary document instead and the reader has scrolled into it, remember where, so the
  // thread starts at the same place instead of throwing them back.
  const root = document.documentElement;
  const reading = !root.classList.contains("thread-on") && window.scrollY > 4 ? readingPlace(sections) : null;

  // Switch the page into its thread layout first, so every measurement below is final.
  document.body.prepend(canvas);
  root.classList.add("thread-on");

  let q = quality(detectTier(caps.renderer));
  const dataReady = loadZenarios();

  let cssW = 0;
  let cssH = 0;
  const viewport = () => {
    const r = canvas.getBoundingClientRect();
    return { w: r.width || window.innerWidth, h: r.height || window.innerHeight };
  };

  // Where the real headline is, in the canvas's coordinates, so the drawn name lands on it.
  const measureName = () => {
    const { w, h } = viewport();
    const range = document.createRange();
    range.selectNodeContents(nameEl);
    const r = range.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(nameEl).fontSize);
    const cap = fontSize * capHeight(nameEl);
    // A zero-size inline block sits exactly on the baseline.
    const marker = document.createElement("span");
    marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    nameEl.append(marker);
    const baseline = marker.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top;
    marker.remove();
    const rect: Rect = {
      x0: (r.left / w) * 2 - 1,
      x1: (r.right / w) * 2 - 1,
      y0: 1 - (baseline / h) * 2,
      y1: 1 - ((baseline - cap) / h) * 2,
    };
    return { rect, aspect: r.width / cap };
  };

  const [data] = await Promise.all([dataReady, document.fonts?.ready]);
  let name = measureName();
  const portraitOf = (w: number, h: number) => w / h < 1;
  const first = viewport();
  const scene = new Scene(data, {
    detail: q.detail,
    nameAspect: name.aspect,
    portrait: portraitOf(first.w, first.h),
    dust: q.dust,
  });
  const sparks = new Sparks(q.tier === "low" ? 80 : 160);
  const renderer = new Renderer(caps, scene, data, sparks, q);
  const camera = new CameraRig(scene);
  const timeline = new ScrollTimeline(sections);
  const sync = new DomSync(
    document,
    () => scene.anchors,
    () => scene.planes,
    !params.has("freeze")
  );
  const monitor = new FrameMonitor();
  const scrollToT = (t: number) =>
    window.scrollTo({
      top: timeline.scrollFor(t),
      behavior: Math.abs(t - timeline.value) > 2 ? "instant" : "smooth",
    });
  const chrome = new Chrome(timeline.total, scrollToT);

  const fixedT = params.get("t");
  const freeze = params.has("freeze");
  // Jump straight to a moment (for screenshots and tuning): scroll there, no glide or fade.
  const jumpTo = (t: number) => {
    window.scrollTo({ top: timeline.scrollFor(t), behavior: "instant" });
    timeline.snap();
  };

  let renderScale = 1;
  let px = 1;
  const resize = (force = false) => {
    const { w, h } = viewport();
    // Phones resize the window as their toolbars slide; the canvas (100lvh) doesn't. Only a real
    // change of size (rotation, a desktop window) re-lays out.
    if (!force && Math.abs(w - cssW) < 1 && Math.abs(h - cssH) < cssH * 0.12) return;
    const dpr = Math.min(window.devicePixelRatio || 1, q.dprCap);
    px = dpr * renderScale;
    const portrait = portraitOf(w, h);
    if (portrait !== scene.portrait) scene.layout(portrait);
    cssW = w;
    cssH = h;
    renderer.resize(w * px, h * px);
    name = measureName();
    timeline.measure();
    sync.measure();
    camera.build({ width: w, height: h, nameRect: name.rect });
  };
  resize(true);
  if (fixedT !== null) jumpTo(Number(fixedT));
  else if (reading?.station) jumpTo(stationStart(reading.station) + 0.62);
  else if (reading?.below !== undefined) {
    const end = sections[sections.length - 1].getBoundingClientRect().bottom;
    window.scrollTo({ top: window.scrollY + end - reading.below, behavior: "instant" });
    timeline.snap();
  }
  // Hold the timeline at a moment without scrolling (headless renders, design review).
  const hold = params.get("hold");
  if (hold !== null) timeline.override = Number(hold);
  if (hold !== null || params.has("debug")) {
    (window as unknown as { __thread: unknown }).__thread = { scene, camera, renderer, timeline };
  }

  // Pointer: the thread leans towards it, and the camera drifts a touch.
  const pointer = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5, pull: 0, lastMove: -1e9 };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    pointer.x = e.clientX / cssW;
    pointer.y = e.clientY / cssH;
    pointer.lastMove = performance.now();
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let debug: import("./debug/panel").DebugPanel | null = null;
  if (params.has("debug")) {
    const { DebugPanel } = await import("./debug/panel");
    debug = new DebugPanel(timeline.total, jumpTo, (t) => (timeline.override = t));
  }

  const ro = new ResizeObserver(() => timeline.measure());
  ro.observe(document.body);
  let resizeFrame = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => resize());
  };
  window.addEventListener("resize", onResize);

  // The opening write-on runs on the clock; scrolling early hurries it along. Once the name is
  // written, a glint runs along it.
  // Starting further down (a reload restores the scroll position), the name is already written.
  const writeStart = performance.now() + WRITE_DELAY;
  let write = freeze || fixedT !== null || hold !== null || timeline.value > 0.3 ? 1 : 0;
  let glintStart = -1;
  let running = true;
  let raf = 0;
  let last = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dtMs = Math.min(100, now - last);
    last = now;
    const dt = dtMs / 1000;

    const t = timeline.update(dt);
    if (write < 1 && now > writeStart) {
      const hurry = t > 0.02 ? 4 : 1;
      write = clamp(write + (dtMs / WRITE_DURATION) * hurry);
      if (write >= 1 && !freeze) glintStart = now;
    }
    const w = E.inOutSine(write);
    nameEl.style.opacity = String(1 - clamp(w * 1.3));

    scene.update(t, w);
    // A glint along the freshly written name; later, the token travelling through Origins.
    const g = glintStart < 0 ? 2 : (now - glintStart) / GLINT_DURATION;
    const glint = g < 1 ? -120 + E.inOutSine(g) * (scene.figures[0].count + 240) : (scene.pulse ?? -1e6);

    // Pointer: ease towards it; the pull fades after the pointer rests.
    const k = 1 - Math.exp(-dt / 0.12);
    pointer.sx += (pointer.x - pointer.sx) * k;
    pointer.sy += (pointer.y - pointer.sy) * k;
    const active = now - pointer.lastMove < 1400 && !freeze ? 1 : 0;
    pointer.pull += (active - pointer.pull) * (1 - Math.exp(-dt / 0.6));
    const time = freeze ? 0 : now / 1000;
    const drift: [number, number] = [
      Math.sin(time * 0.21) * 0.08 + (pointer.sx - 0.5) * 0.5,
      Math.sin(time * 0.17) * 0.05 - (pointer.sy - 0.5) * 0.3,
    ];
    const viewProj = camera.update(t, cssW, cssH, drift);
    const { pos: eye, target: aim } = camera.pose;
    const focus = Math.hypot(eye[0] - aim[0], eye[1] - aim[1], eye[2] - aim[2]);

    const pen = scene.penPosition();
    const tint = scene.tintAt(scene.head);
    const penMoving = (write > 0 && write < 1) || Math.abs(timeline.velocity) > 0.02;
    sparks.update(pen, tint, freeze ? 0 : dt, penMoving);
    const fan = fanState(t);

    renderer.render({
      viewProj,
      projScale: camera.projScale * px,
      px,
      cursor: [pointer.sx * cssW * px, (1 - pointer.sy) * cssH * px, 0.16 * pointer.pull, 150 * px],
      reveal: fan.reveal,
      collapse: fan.collapse,
      ghost: write < 1 ? 0 : 0.06,
      trailDim: 1 - cue(t, CUES["end.overview"]),
      // Fog starts just beyond what the camera looks at: the station in view stays clear on any
      // screen, the ones far away sink into the dark (all of it shows in the closing overview).
      fogStart: focus + 16 + 420 * cue(t, CUES["end.overview"]),
      fade: timeline.fade,
      time,
      glint,
      pen,
      dust: 0.25 + 0.75 * smoothstep(0.15, 0.6, t),
      lineScale: clamp(Math.min(cssW, cssH * 1.6) / 1440, 0.55, 1),
      nib: [...tint, (write > 0 ? 0.85 : 0) * (1 - cue(t, CUES["end.overview"]) * 0.7)],
      frame: frame++,
    });
    sync.update(t, now, viewProj, cssW, cssH);
    chrome.update(t);
    // The text is hidden until the timeline has placed it once (Thread.astro).
    if (frame === 1) root.classList.add("thread-ready");

    monitor.push(dtMs);
    if (monitor.struggling()) {
      const i = FrameMonitor.SCALES.indexOf(renderScale);
      if (i < FrameMonitor.SCALES.length - 1) {
        renderScale = FrameMonitor.SCALES[i + 1];
      } else if (q.tier !== "low") {
        q = quality(q.tier === "high" ? "mid" : "low");
        renderer.quality = q;
        renderScale = 1;
      }
      monitor.reset();
      resize(true);
    }

    debug?.update({
      t,
      frameMs: dtMs,
      p50: monitor.percentile(0.5),
      p90: monitor.percentile(0.9),
      tier: q.tier,
      scale: renderScale,
      size: `${renderer.width}×${renderer.height}`,
      renderer: caps.renderer,
      float: caps.floatTarget,
    });
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (running) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    timeline.dispose();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    root.classList.remove("thread-on", "thread-ready");
    nameEl.style.opacity = "";
    canvas.remove();
    debug?.dispose();
  };
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stop();
  });

  raf = requestAnimationFrame(tick);
  return { stop };
}
