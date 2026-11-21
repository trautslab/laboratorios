import { readFileSync } from 'node:fs';

const plan = JSON.parse(readFileSync(new URL('./network-plan.json', import.meta.url), 'utf8'));
const scenarios = JSON.parse(readFileSync(new URL('./scenarios.json', import.meta.url), 'utf8'));
const allowed = new Set(['network', 'subnet', 'security-group']);
const planChecks = {
  localFixture: plan.provider === 'local-fixture',
  boundedCost: plan.maxMonthlyEstimateUsd <= 5,
  privateByDefault: plan.publicIngress.length === 0,
  allowedResources: plan.resources.every((resource) => allowed.has(resource)),
  teardownDeclared: plan.teardown.length >= 2,
};

const scenarioChecks = {
  state:
    scenarios.state.remoteBackend && scenarios.state.encrypted && scenarios.state.versioned &&
    scenarios.state.locking && scenarios.state.restoreRehearsed,
  modules:
    scenarios.modules.typedInputs && scenarios.modules.boundedOutputs &&
    scenarios.modules.hiddenProviderConfiguration === false && scenarios.modules.fixtureTest,
  policy:
    scenarios.policy.planJsonReviewed && scenarios.policy.denyPublicIngress &&
    scenarios.policy.maximumMonthlyEstimateUsd <= plan.maxMonthlyEstimateUsd &&
    scenarios.policy.allowedResources.every((resource) => allowed.has(resource)),
  recovery:
    scenarios.recovery.preserveStateCopy && scenarios.recovery.identifyLockOwner &&
    scenarios.recovery.compareRemoteObjects && scenarios.recovery.planAfterImport &&
    scenarios.recovery.blindForceUnlock === false,
};

const requestedScenario = process.argv[2];
const selectedScenarioChecks = requestedScenario
  ? { [requestedScenario]: scenarioChecks[requestedScenario] }
  : scenarioChecks;
const knownScenario = !requestedScenario || Object.hasOwn(scenarioChecks, requestedScenario);
const valid = knownScenario && Object.values(planChecks).every(Boolean) && Object.values(selectedScenarioChecks).every(Boolean);

console.log(JSON.stringify({ plan, requestedScenario: requestedScenario ?? 'all', planChecks, scenarioChecks: selectedScenarioChecks, valid }, null, 2));
if (!valid) process.exit(1);
