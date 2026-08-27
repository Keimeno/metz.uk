// The page's frame around the thread: the name docking into the header once the big one has
// turned into light, the chapter list marking where you are, and the progress line.

import { smoothstep } from "./math";
import { CHAPTERS, STATIONS, stationStart, type StationId } from "./timeline";

export class Chrome {
  private mark: HTMLElement | null;
  private progress: HTMLElement | null;
  private chapters: HTMLElement[];
  private active = "";
  private markV = -1;
  private p = -1;

  constructor(
    private total: number,
    private scrollTo: (t: number) => void
  ) {
    this.mark = document.querySelector("[data-dock]");
    this.progress = document.querySelector("[data-progress]");
    this.chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    for (const el of this.chapters) {
      const station = CHAPTERS.find((c) => c.id === el.dataset.chapter)?.station;
      if (!station || !(el instanceof HTMLAnchorElement)) continue;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        this.scrollTo(stationStart(station) + 0.62);
      });
    }
    this.mark?.addEventListener("click", (e) => {
      e.preventDefault();
      this.scrollTo(0);
    });
  }

  update(t: number) {
    const v = Math.round(smoothstep(0.22, 0.5, t) * 100) / 100;
    if (this.mark && v !== this.markV) {
      this.markV = v;
      this.mark.style.opacity = String(v);
      this.mark.style.transform = `translate3d(0, ${((1 - v) * 10).toFixed(1)}px, 0)`;
    }
    const p = Math.round((t / this.total) * 1000) / 1000;
    if (this.progress && p !== this.p) {
      this.p = p;
      this.progress.style.setProperty("--p", String(p));
    }
    const station = this.stationAt(t);
    if (station !== this.active) {
      this.active = station;
      for (const el of this.chapters) {
        const on = CHAPTERS.find((c) => c.id === el.dataset.chapter)?.station === station;
        if (on) el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
      }
    }
  }

  private stationAt(t: number): StationId | "" {
    let start = 0;
    for (const s of STATIONS) {
      if (t >= start && t < start + s.beats) return s.id;
      start += s.beats;
    }
    return "";
  }
}
