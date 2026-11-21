import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const transactions = JSON.parse(readFileSync(new URL('./transactions.json', import.meta.url), 'utf8'));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const genesis = { alice: 100, bob: 25, carol: 0 };
const domain = 'trautslab-rollup-mock-v1';

function execute(initial, batch) {
  const state = new Map(Object.entries(initial));
  for (const tx of batch) {
    if ((state.get(tx.from) ?? 0) < tx.amount) throw new Error(`insufficient balance: ${tx.from}`);
    state.set(tx.from, state.get(tx.from) - tx.amount);
    state.set(tx.to, (state.get(tx.to) ?? 0) + tx.amount);
  }
  return state;
}
const rootOf = (state) => hash([...state.entries()].sort());
const proofOf = (batchDigest, stateRoot) => hash({ batchDigest, stateRoot, domain });

// Sequencer: executes the batch and publishes (batchDigest, stateRoot, mockProof).
const state = execute(genesis, transactions);
const claim = { batchDigest: hash(transactions), stateRoot: rootOf(state) };
claim.mockProof = proofOf(claim.batchDigest, claim.stateRoot);

// Verifier: re-executes the published batch from the previous state and checks the claim.
function verify(prev, batch, candidate) {
  const recomputedRoot = rootOf(execute(prev, batch));
  return (
    candidate.batchDigest === hash(batch) &&
    candidate.stateRoot === recomputedRoot &&
    candidate.mockProof === proofOf(candidate.batchDigest, candidate.stateRoot)
  );
}
const verified = verify(genesis, transactions, claim);
const tamperedRoot = hash([...execute(genesis, transactions).set('carol', 1000).entries()].sort());
const tampered = { ...claim, stateRoot: tamperedRoot, mockProof: proofOf(claim.batchDigest, tamperedRoot) };
const tamperRejected = !verify(genesis, transactions, tampered);

const report = {
  before: genesis,
  transactions,
  after: Object.fromEntries(state),
  batchDigest: claim.batchDigest,
  stateRoot: claim.stateRoot,
  mockProof: claim.mockProof,
  verified,
  tamperRejected,
  warning: 'Mock proof: not a validity or fraud proof.',
};
console.log(JSON.stringify(report, null, 2));
if (!verified || !tamperRejected || [...state.values()].reduce((sum, value) => sum + value, 0) !== 125) process.exit(1);
