// `?debug`: a timeline scrubber, frame times and the active quality settings. Loaded only when
// asked for, never part of the normal page.

export interface DebugInfo {
  t: number;
  frameMs: number;
  p50: number;
  p90: number;
  tier: string;
  scale: number;
  size: string;
  renderer: string;
  float: boolean;
}

export class DebugPanel {
  private el: HTMLDivElement;
  private stats: HTMLPreElement;
  private slider: HTMLInputElement;
  private hold: HTMLInputElement;
  private graph: HTMLCanvasElement;
  private samples: number[] = [];

  constructor(total: number, onScrub: (t: number) => void, onHold: (t: number | null) => void) {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText =
      "position:fixed;left:12px;bottom:12px;z-index:50;width:300px;padding:10px 12px;border-radius:10px;" +
      "background:rgba(20,20,22,.88);color:#edebe6;font:11px/1.45 var(--font-mono,monospace);" +
      "backdrop-filter:blur(8px);border:1px solid rgba(237,235,230,.12)";
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <strong style="font-weight:600">Thread debug</strong>
        <label><input type="checkbox" data-hold> hold t</label>
      </div>
      <input type="range" min="0" max="${total}" step="0.001" value="0" style="width:100%" data-t>
      <canvas width="276" height="40" style="width:276px;height:40px;display:block;margin:6px 0" data-graph></canvas>
      <pre style="margin:0;white-space:pre-wrap" data-stats></pre>`;
    document.body.append(el);
    this.el = el;
    this.stats = el.querySelector("[data-stats]")!;
    this.slider = el.querySelector("[data-t]")!;
    this.hold = el.querySelector("[data-hold]")!;
    this.graph = el.querySelector("[data-graph]")!;
    this.slider.addEventListener("input", () => {
      const t = Number(this.slider.value);
      if (this.hold.checked) onHold(t);
      else onScrub(t);
    });
    this.hold.addEventListener("change", () => onHold(this.hold.checked ? Number(this.slider.value) : null));
  }

  update(info: DebugInfo) {
    if (!this.hold.checked) this.slider.value = String(info.t);
    this.samples.push(info.frameMs);
    if (this.samples.length > 138) this.samples.shift();
    this.stats.textContent =
      `t ${info.t.toFixed(3)}   frame ${info.frameMs.toFixed(1)} ms\n` +
      `p50 ${info.p50.toFixed(1)}  p90 ${info.p90.toFixed(1)} ms\n` +
      `tier ${info.tier}  scale ${info.scale}  ${info.size}\n` +
      `float ${info.float ? "yes" : "no"}  ${info.renderer.slice(0, 40)}`;
    const g = this.graph.getContext("2d")!;
    g.clearRect(0, 0, 276, 40);
    g.fillStyle = "rgba(237,235,230,.08)";
    g.fillRect(0, 40 - (16.7 / 40) * 40, 276, 1);
    g.fillStyle = "#34d07f";
    this.samples.forEach((ms, i) => {
      const h = Math.min(40, (ms / 40) * 40);
      g.fillStyle = ms > 18 ? "#ff6a5c" : "#34d07f";
      g.fillRect(i * 2, 40 - h, 1.5, h);
    });
  }

  dispose() {
    this.el.remove();
  }
}
