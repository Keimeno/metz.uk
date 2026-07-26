// Quality tiers and the frame-time watchdog. The tier is a guess from the device; the watchdog
// corrects it: if frames run slow, it lowers the resolution, then the tier. It never raises
// either mid-session, so the picture doesn't pump.

export type Tier = "high" | "mid" | "low";

export interface Quality {
  tier: Tier;
  /** Highest device-pixel ratio to render at. */
  dprCap: number;
  /** Futures in the Zenarios fan. */
  fan: number;
  /** Segments per future. */
  fanSegs: number;
  bloom: boolean;
  /** Multiplier for the thread's point budgets. */
  detail: number;
  /** Motes of dust along the path. */
  dust: number;
}

export const TIERS: Record<Tier, Omit<Quality, "tier">> = {
  high: { dprCap: 2, fan: 1000, fanSegs: 96, bloom: true, detail: 1, dust: 1100 },
  mid: { dprCap: 2, fan: 512, fanSegs: 72, bloom: false, detail: 1, dust: 650 },
  low: { dprCap: 1.5, fan: 256, fanSegs: 48, bloom: false, detail: 0.5, dust: 300 },
};

export const quality = (tier: Tier): Quality => ({ tier, ...TIERS[tier] });

export function detectTier(renderer: string): Tier {
  const forced = new URLSearchParams(location.search).get("tier");
  if (forced === "high" || forced === "mid" || forced === "low") return forced;
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return "low";
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (coarse) return (navigator.hardwareConcurrency ?? 4) >= 6 ? "mid" : "low";
  if (/apple m\d|apple gpu|nvidia|geforce|radeon|rtx|quadro|arc/i.test(renderer)) return "high";
  return "mid";
}

/** Watches frame times and says when to step quality down. */
export class FrameMonitor {
  private times = new Float32Array(120);
  private n = 0;
  private cooldown = 90;
  /** Render scale steps; past the last one, drop a tier. */
  static readonly SCALES = [1, 0.85, 0.7];

  push(ms: number) {
    this.times[this.n % this.times.length] = ms;
    this.n++;
    if (this.cooldown > 0) this.cooldown--;
  }

  percentile(q: number) {
    const k = Math.min(this.n, this.times.length);
    if (k === 0) return 0;
    const s = Array.from(this.times.subarray(0, k)).sort((a, b) => a - b);
    return s[Math.min(k - 1, Math.floor(q * (k - 1)))];
  }

  /** True when the last two seconds ran slow (p90 over 18 ms) and we haven't just changed. */
  struggling() {
    if (this.cooldown > 0 || this.n < this.times.length) return false;
    return this.percentile(0.9) > 18;
  }

  reset() {
    this.n = 0;
    this.cooldown = 120;
  }
}
