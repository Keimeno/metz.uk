// Runs inside the Zenarios app's own code (bundled by `zenarios.mjs` with the app's `@/` imports):
// builds the app's built-in "buy or rent" example (the Beckers in Region Hannover, the household
// of the App Store screenshots), projects it month by month, and simulates 1,000 market futures,
// exactly as the app does. No React or React Native: only the domain and the engine.

import { de } from "@/core/i18n/de";
import { en } from "@/core/i18n/en";
import { createDictionaryTranslator } from "@/core/i18n/translate";
import { fixedClock } from "@/domain/clock";
import { ENGINE_VERSION } from "@/engine/engineVersion";
import { computeInputHash } from "@/engine/inputHash";
import { getDefaultMetricRegistry } from "@/engine/metrics/metricRegistry";
import { runProjection } from "@/engine/runProjection";
import { MARKET_MODEL_VERSION } from "@/engine/stochastic/marketModel";
import { createMonteCarloRun } from "@/engine/stochastic/monteCarlo";
import { seedFromString } from "@/engine/stochastic/prng";
import { buildExamplePlan } from "@/features/examples/examplePlans";

export const EXAMPLE = "buyOrRent";
/** The moment the website's figures describe. */
export const NOW = "2026-10-01T09:00:00.000Z";

export function generate() {
  const clock = fixedClock(NOW);
  const translate = createDictionaryTranslator(en as unknown as Record<string, string>);
  const translateDe = createDictionaryTranslator(de as unknown as Record<string, string>);

  const built = buildExamplePlan(EXAMPLE, { clock, translate });
  if (!built.ok) throw new Error(`Example failed to build: ${built.reason}`);
  const snapshot = built.plan.baseline;

  const projected = runProjection(snapshot, { clock });
  if (!projected.ok) throw new Error(`Projection failed: ${JSON.stringify(projected.issues)}`);
  const result = projected.result;

  // The same seed rule as the app (one seed per plan); exactly 1,000 trials, no early stop.
  const seed = seedFromString(`example:${EXAMPLE}`);
  const run = createMonteCarloRun(snapshot, getDefaultMetricRegistry(), {
    seed,
    maxTrials: 1000,
    minTrials: 1000,
    targetStandardErrorBp: 0,
  });
  while (!run.finished()) run.step(100);
  const trials = run.trials();

  // Names of the household's life events, in both languages the site speaks.
  const deBuilt = buildExamplePlan(EXAMPLE, { clock, translate: translateDe });
  const deNames = new Map(
    deBuilt.ok ? deBuilt.plan.baseline.milestones.map((m) => [m.id, m.name] as const) : []
  );
  const milestones = snapshot.milestones.map((m) => {
    const p = result.milestones.find((x) => x.milestoneId === m.id);
    return {
      id: m.id,
      template: (m as { template?: string }).template ?? null,
      name: { en: m.name, de: deNames.get(m.id) ?? m.name },
      month: p?.reachedMonth ?? p?.scheduledMonth ?? null,
      index: p?.reachedIndex ?? null,
    };
  });

  return {
    meta: {
      example: EXAMPLE,
      plan: { en: built.plan.name, de: deBuilt.ok ? deBuilt.plan.name : built.plan.name },
      scenario: snapshot.meta.title,
      now: NOW,
      engineVersion: ENGINE_VERSION,
      marketModelVersion: MARKET_MODEL_VERSION,
      inputHash: computeInputHash(snapshot),
      seed,
      startMonth: snapshot.assumptions.startMonth,
      horizonMonths: snapshot.assumptions.horizonMonths,
      people: snapshot.people.map((p) => ({ role: p.role, name: p.displayName, born: p.birthMonth })),
    },
    /** Net worth at each month end, euros. */
    monthly: result.months.map((m) => m.netWorth / 100),
    milestones,
    fire: result.fire,
    summary: result.summary,
    trials: {
      count: trials.count,
      years: trials.years,
      /** Year-end net worth, trial-major, euros. */
      netWorth: Array.from(trials.netWorth, (v) => v / 100),
      firstShortfall: Array.from(trials.firstShortfall),
    },
  };
}
