// Generates the Zenarios station's data from the real engine.
//
//   node scripts/gen/zenarios.mjs            (expects the app at ../zenarios-app)
//   ZENARIOS_APP=/path/to/zenarios-app node scripts/gen/zenarios.mjs
//
// Bundles `zenarios-entry.ts` together with the app's domain and engine (resolving the app's `@/`
// imports), runs it, and writes two files that are committed, so the site never needs the app:
//   src/generated/zenarios.json        the figures for the HTML (numbers, labels, provenance)
//   src/generated/zenarios-thread.json the geometry the thread draws (display units, compact)

import { build } from "esbuild";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const app = resolve(process.env.ZENARIOS_APP ?? join(root, "../zenarios-app"));
const out = join(root, ".cache/zen-engine.mjs");

// 1. Bundle the entry with the app's code. Anything from React Native would mean the engine is no
//    longer pure, so it fails the build.
const result = await build({
  entryPoints: [join(root, "scripts/gen/zenarios-entry.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: out,
  metafile: true,
  logLevel: "warning",
  plugins: [
    {
      // The app reads the phone's language through Expo; nothing here calls it, so a stub does.
      name: "no-device",
      setup(b) {
        b.onResolve({ filter: /^expo-localization$/ }, () => ({ path: "expo-localization", namespace: "stub" }));
        b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: "export const getLocales = () => [{ languageCode: 'en' }];",
          loader: "js",
        }));
      },
    },
    {
      name: "app-alias",
      setup(b) {
        b.onResolve({ filter: /^@\// }, async (args) => {
          const resolved = await b.resolve("./" + args.path.slice(2), {
            resolveDir: join(app, "src"),
            kind: args.kind,
          });
          return resolved.errors.length ? { errors: resolved.errors } : { path: resolved.path };
        });
      },
    },
  ],
});
const impure = Object.keys(result.metafile.inputs).filter((f) =>
  /node_modules\/(react-native|expo|react)\//.test(f)
);
if (impure.length) throw new Error(`The engine bundle pulled in UI code:\n${impure.join("\n")}`);

// 2. Run it.
const { generate } = await import(pathToFileURL(out).href + `?t=${Date.now()}`);
const raw = generate();
const appSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: app }).toString().trim();
  } catch {
    return "unknown";
  }
})();

// 3. Shape it for the site.
const { meta, monthly, milestones, trials } = raw;
const years = trials.years;
const cols = years + 1;
const [startYear, startMonth] = meta.startMonth.split("-").map(Number);

// Year-end values per trial, with today's net worth in front, so every future starts together.
const trialRow = (t) => [monthly[0], ...trials.netWorth.slice(t * years, t * years + years)];
const forecastYearly = Array.from({ length: cols }, (_, y) => monthly[Math.min(y * 12, monthly.length - 1)]);

// Display scale: asinh-compressed euros over the central 99 % of all futures, extremes eased
// towards the edges instead of clipped. The same function as the old stand-in, now on real data.
const SCALE = 50_000;
const all = [];
for (let t = 0; t < trials.count; t++) for (const v of trialRow(t)) all.push(Math.asinh(v / SCALE));
all.sort((a, b) => a - b);
const q = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))];
const lo = q(all, 0.005);
const hi = q(all, 0.995);
const pad = (hi - lo) * 0.1;
const uLo = lo - pad;
const uHi = hi + pad;
const knee = 0.08;
const soft = (x) =>
  x > 1 - knee ? 1 - knee + knee * Math.tanh((x - (1 - knee)) / knee) : x < knee ? knee - knee * Math.tanh((knee - x) / knee) : x;
const unit = (euro) => soft((Math.asinh(euro / SCALE) - uLo) / (uHi - uLo));

// Trials ranked by their final value, stored in a stratified order: any prefix (the 256 or 512
// a phone draws) is a fair sample of the whole spread.
const finals = Array.from({ length: trials.count }, (_, t) => ({ t, v: trials.netWorth[t * years + years - 1] }));
finals.sort((a, b) => a.v - b.v);
const bits = Math.ceil(Math.log2(trials.count));
const order = [];
for (let k = 0; k < 1 << bits; k++) {
  let r = 0;
  for (let b = 0; b < bits; b++) if (k & (1 << b)) r |= 1 << (bits - 1 - b);
  if (r < trials.count) order.push(r);
}
const fan = new Uint8Array(trials.count * cols);
const pct = new Uint8Array(trials.count);
order.forEach((rank, i) => {
  pct[i] = Math.round((rank / (trials.count - 1)) * 255);
  trialRow(finals[rank].t).forEach((v, y) => (fan[i * cols + y] = Math.round(unit(v) * 255)));
});
const medianYearly = Array.from({ length: cols }, (_, y) => {
  const col = Array.from({ length: trials.count }, (_, t) => trialRow(t)[y]).sort((a, b) => a - b);
  return col[Math.floor(col.length / 2)];
});

// Retirement: the first person's retirement as the engine reports it, else the FIRE month.
const monthIndex = (key) => {
  if (!key) return null;
  const [y, m] = key.split("-").map(Number);
  return (y - startYear) * 12 + (m - startMonth);
};
const percentileAt = (yearIndex, p) => {
  const col = Array.from({ length: trials.count }, (_, t) => trialRow(t)[yearIndex]).sort((a, b) => a - b);
  return col[Math.round((col.length - 1) * p)];
};
const solvent = trials.firstShortfall.filter((s) => s < 0).length;

const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
const thread = {
  startYear,
  years,
  months: monthly.length,
  trials: trials.count,
  endP10: round(unit(percentileAt(years, 0.1))),
  endP90: round(unit(percentileAt(years, 0.9))),
  forecast: monthly.map((v) => round(unit(v))),
  forecastYearly: forecastYearly.map((v) => round(unit(v))),
  medianYearly: medianYearly.map((v) => round(unit(v))),
  fan: Buffer.from(fan).toString("base64"),
  percentile: Buffer.from(pct).toString("base64"),
  milestones: milestones
    .filter((m) => m.month)
    .map((m) => ({ id: m.id, index: monthIndex(m.month), name: m.name, template: m.template })),
};

const figures = {
  provenance: {
    source: "Zenarios engine, run on the app's built-in example plan",
    plan: meta.plan,
    scenario: meta.scenario,
    asOf: meta.now.slice(0, 10),
    engineVersion: meta.engineVersion,
    marketModelVersion: meta.marketModelVersion,
    inputHash: meta.inputHash,
    seed: meta.seed,
    appCommit: appSha,
  },
  people: meta.people,
  startMonth: meta.startMonth,
  horizonMonths: meta.horizonMonths,
  trials: trials.count,
  today: Math.round(monthly[0]),
  end: Math.round(monthly[monthly.length - 1]),
  successRate: round(solvent / trials.count, 3),
  endP10: Math.round(percentileAt(years, 0.1)),
  endP50: Math.round(percentileAt(years, 0.5)),
  endP90: Math.round(percentileAt(years, 0.9)),
  milestones: thread.milestones,
  fire: raw.fire ?? null,
};

mkdirSync(join(root, "src/generated"), { recursive: true });
writeFileSync(join(root, "src/generated/zenarios.json"), JSON.stringify(figures, null, 2) + "\n");
writeFileSync(join(root, "src/generated/zenarios-thread.json"), JSON.stringify(thread) + "\n");
console.log(
  `Zenarios: ${trials.count} futures × ${cols} years, ${monthly.length} months, ` +
    `${thread.milestones.length} milestones, success ${(figures.successRate * 100).toFixed(1)} %, ` +
    `engine ${meta.engineVersion}, app ${appSha}`
);
