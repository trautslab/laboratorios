import { readFileSync } from 'node:fs';

const scenarios = JSON.parse(readFileSync(new URL('./scenarios.json', import.meta.url), 'utf8'));
const report = scenarios.map((scenario) => ({
  ...scenario,
  medianLatencyMs: [...scenario.latenciesMs].sort((a, b) => a - b)[Math.floor(scenario.latenciesMs.length / 2)],
  recoveryViews: scenario.views - scenario.commits,
  live: scenario.commits > 0,
}));
const summary = {
  fixture: 'pedagogical-not-a-protocol-benchmark',
  safetyPreserved: report.every((scenario) => scenario.safetyViolations === 0),
  livenessRecovered: report.every((scenario) => scenario.live),
  scenarios: report,
};
console.log(JSON.stringify(summary, null, 2));
if (!summary.safetyPreserved || !summary.livenessRecovered) process.exit(1);
