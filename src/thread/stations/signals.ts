// Station 2: Signals. The trend analyzer (WGRA): the pen draws a word's share of the conversation
// until an onset is detected; the camera pulls back to the 37 subreddits it reads, and the trend
// travels along the leader → follower edges its lead–lag model learns. Then the line becomes a
// voice (LiveTranslate): a waveform, with captions in three languages.
//
// The subreddits and groups are WGRA's real configuration. The trend and its path through them
// are a replay with a planted signal — the way WGRA's lead–lag model is evaluated — and the page
// says so.

import { at, cue, stationStart, type Cue } from "../beats";
import { E, clamp, prng, type Vec3 } from "../math";
import { resample } from "../geometry/path";
import {
  LINE_POINTS,
  circle,
  holdBetween,
  localToWorld,
  toWorld,
  type LineDef,
  type StationModule,
} from "./kit";

export const CUES = {
  arrive: at("signals", -0.55, 0.45),
  trend: at("signals", 0.45, 1.0),
  graph: at("signals", 1.1, 1.9),
  wave: at("signals", 1.95, 2.35),
} as const satisfies Record<string, Cue>;

export const PANELS = {
  "sig.title": at("signals", 0.55, 1.15),
  "sig.graph": at("signals", 1.25, 1.95),
  "sig.live": at("signals", 2.1, 2.8),
  "sig.onset": at("signals", 0.86, 1.95),
  "sig.src": at("signals", 1.15, 1.95),
  "sig.n1": at("signals", 1.4, 1.95),
  "sig.n2": at("signals", 1.55, 1.95),
  "sig.n3": at("signals", 1.7, 1.95),
  "sig.caption": at("signals", 2.12, 2.8),
} as const satisfies Record<string, Cue>;

/** WGRA's tracked subreddits, by group (v2/config.yaml). */
const GROUPS: Record<string, string[]> = {
  tech: [
    "technology", "programming", "hardware", "gadgets", "LocalLLaMA", "MachineLearning", "artificial",
    "OpenAI", "ClaudeAI", "singularity", "webdev", "ExperiencedDevs", "cscareerquestions", "apple",
    "Android", "linux", "selfhosted", "homelab", "buildapc",
  ],
  science: ["science", "space", "Futurology"],
  news: ["news", "worldnews", "europe"],
  finance: ["investing", "stocks", "wallstreetbets", "personalfinance", "CryptoCurrency", "Economics"],
  gaming: ["gaming", "Games", "pcgaming"],
  de: ["de", "Finanzen", "de_EDV"],
};

/** The replay: where the planted trend starts, and who picks it up after whom. */
const SOURCE = "LocalLLaMA";
const EDGES: [string, string, number][] = [
  ["LocalLLaMA", "MachineLearning", 1],
  ["LocalLLaMA", "OpenAI", 1],
  ["LocalLLaMA", "ClaudeAI", 1],
  ["LocalLLaMA", "selfhosted", 1],
  ["MachineLearning", "artificial", 2],
  ["OpenAI", "singularity", 2],
  ["OpenAI", "technology", 2],
  ["ClaudeAI", "programming", 2],
  ["selfhosted", "homelab", 2],
  ["technology", "Futurology", 3],
  ["technology", "news", 3],
  ["programming", "webdev", 3],
  ["programming", "de_EDV", 3],
  ["singularity", "investing", 3],
  ["news", "worldnews", 4],
  ["investing", "Economics", 4],
  ["de_EDV", "de", 4],
];
const LEVELS = 4;
/** Labelled nodes: the source and a few followers. */
export const NODE_LABELS = { "sig.src": "LocalLLaMA", "sig.n1": "MachineLearning", "sig.n2": "technology", "sig.n3": "de_EDV" };

const AMBER: Vec3 = [1.0, 0.74, 0.32];
const DIM: Vec3 = [0.93, 0.9, 0.84];

export const signals: StationModule = {
  id: "signals",
  budget: 768,
  build(ctx, frame, budget) {
    const W = 14;
    const H = ctx.portrait ? 8 : 5;
    const rand = prng(23);

    // The trend: a word's share of the conversation, hour by hour, with a daily rhythm, until it
    // takes off. Index 1 = its usual share.
    const hours = 96;
    const onsetHour = 63;
    const share = Array.from({ length: hours }, (_, h) => {
      const daily = 0.16 * Math.sin((2 * Math.PI * (h - 8)) / 24);
      const noise = (rand() - 0.5) * 0.22;
      const surge = 4.4 / (1 + Math.exp(-(h - 68) / 2.4));
      return 1 + daily + noise + surge;
    });
    const sMin = 0.6;
    const sMax = 6.2;
    const trendPts = new Float32Array(hours * 4);
    share.forEach((s, h) =>
      trendPts.set([(h / (hours - 1) - 0.5) * W, ((s - sMin) / (sMax - sMin) - 0.5) * H, 0, 1], h * 4)
    );
    const trend = resample(trendPts, budget);
    const onset: Vec3 = [(onsetHour / (hours - 1) - 0.5) * W, ((share[onsetHour] - sMin) / (sMax - sMin) - 0.5) * H, 0];

    // The voice: a waveform of a short sentence, syllables as swells of amplitude.
    const words = [
      [0.06, 0.12], [0.2, 0.1], [0.33, 0.08], [0.45, 0.13], [0.62, 0.09], [0.74, 0.11], [0.88, 0.08],
    ];
    // Dimmer than ink: hundreds of zigzags add up to plenty of light.
    const exitY = trend[(budget - 1) * 4 + 1];
    const wave = new Float32Array(budget * 4);
    for (let i = 0; i < budget; i++) {
      const u = i / (budget - 1);
      let env = 0.04;
      for (const [c, w] of words) env += 0.9 * Math.exp(-(((u - c) / (w / 2)) ** 2));
      const a = Math.min(env, 1) * (0.55 + 0.45 * rand()) * (H * 0.42);
      // The last stretch eases out of the waveform to where the thread leaves the station.
      const tail = Math.min(Math.max((u - 0.93) / 0.07, 0), 1);
      const ease = tail * tail * (3 - 2 * tail);
      const y = (i % 2 === 0 ? a : -a) * (1 - ease) + exitY * ease;
      wave.set([(u - 0.5) * W, y, 0, 0.45 + 0.55 * ease], i * 4);
    }
    // Start where the trend starts, so the connector meets both figures cleanly.
    wave.set([-W / 2, trend[1], 0, 1], 0);

    // The constellation: WGRA's subreddits around the chart, each group in its own sector.
    const names = Object.values(GROUPS).flat();
    const node = new Map<string, Vec3>();
    const groups = Object.entries(GROUPS);
    let k = 0;
    const total = names.length;
    for (const [, members] of groups) {
      members.forEach((name) => {
        const a = Math.PI * 0.5 - (k / total) * Math.PI * 2 - 0.05 * groups.length;
        const r = 1 + (rand() - 0.5) * 0.16;
        node.set(name, [Math.cos(a) * 12.5 * r, Math.sin(a) * (ctx.portrait ? 10.5 : 7.5) * r, -3 + (rand() - 0.5) * 4]);
        k++;
      });
    }

    const lines: LineDef[] = [];
    const lineMeta: { kind: "node" | "edge"; level: number; name?: string }[] = [];
    const reached = new Map<string, number>([[SOURCE, 0]]);
    for (const [, to, level] of EDGES) reached.set(to, Math.min(reached.get(to) ?? 99, level));
    for (const name of names) {
      const p = node.get(name)!;
      lines.push({ points: localToWorld(frame, circle(p[0], p[1], 0.22, 24, p[2])), color: DIM, width: 0.6 });
      lineMeta.push({ kind: "node", level: reached.get(name) ?? 99, name });
    }
    const arc = (a: Vec3, b: Vec3) => {
      const n = LINE_POINTS;
      const out = new Float32Array(n * 4);
      const mid: Vec3 = [(a[0] + b[0]) / 2 * 0.55, (a[1] + b[1]) / 2 * 0.55, (a[2] + b[2]) / 2 + 2];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const q = (j: number) => (1 - t) ** 2 * a[j] + 2 * (1 - t) * t * mid[j] + t * t * b[j];
        out.set([q(0), q(1), q(2), 1], i * 4);
      }
      return localToWorld(frame, out);
    };
    // The first edge: from the onset on the chart to the subreddit where it began.
    lines.push({ points: arc(onset, node.get(SOURCE)!), color: AMBER, width: 0.9 });
    lineMeta.push({ kind: "edge", level: 0 });
    for (const [from, to, level] of EDGES) {
      lines.push({ points: arc(node.get(from)!, node.get(to)!), color: AMBER, width: 0.9 });
      lineMeta.push({ kind: "edge", level });
    }

    const anchors: Record<string, Vec3> = {
      "sig.onset": toWorld(frame, onset[0], onset[1], onset[2]),
      "sig.caption": toWorld(frame, 0, H * 0.62),
    };
    for (const [id, name] of Object.entries(NODE_LABELS)) {
      const p = node.get(name)!;
      anchors[id] = toWorld(frame, p[0], p[1], p[2]);
    }

    return {
      id: "signals",
      frame,
      keyframes: [localToWorld(frame, trend), localToWorld(frame, wave)],
      color: AMBER,
      width: 1,
      arrive: CUES.arrive,
      pose: (t) => ({ from: 0, to: 1, mix: E.inOutCubic(cue(t, CUES.wave)), stagger: 0.35 }),
      draw: (t) => E.inOutSine(cue(t, CUES.trend)),
      anchors,
      lines,
      lineState(t, out) {
        const g = cue(t, CUES.graph);
        // The constellation recedes as the line becomes a voice.
        const fade = 1 - cue(t, CUES.wave);
        lineMeta.forEach((m, i) => {
          if (m.kind === "node") {
            const lit = m.level <= LEVELS ? clamp((g * (LEVELS + 1.2) - m.level - 0.6) / 0.6) : 0;
            out[i * 2] = clamp(g * 4);
            out[i * 2 + 1] = (0.28 + 0.9 * lit) * fade;
          } else {
            const p = clamp((g * (LEVELS + 1.2) - m.level) / 1.0);
            out[i * 2] = E.inOutCubic(p);
            out[i * 2 + 1] = 0.85 * fade;
          }
        });
      },
      holds(view) {
        const s = stationStart("signals");
        const hh = H / 2;
        return [
          ...holdBetween(s + 0.5, s + 1.05, frame.origin, frame, [-0.1, -0.03], [-0.03, -0.05], W / 2, hh * 1.3, view),
          ...holdBetween(s + 1.25, s + 1.85, toWorld(frame, 0, 0, -1.5), frame, [0.18, -0.12], [0.3, -0.1], 13.5, ctx.portrait ? 11.5 : 8.5, view, 38),
          ...holdBetween(s + 2.1, s + 2.7, toWorld(frame, 0, H * 0.12), frame, [-0.06, -0.02], [0.02, -0.03], W / 2, hh * 1.25, view),
        ];
      },
    };
  },
};
