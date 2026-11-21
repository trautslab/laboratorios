# Rollup mock lab

Version: `2.0.44-alpha.3`

Run `node clasicos/ethereum-rollup-mock-lab/simulate.mjs`. Record state before/after, transaction batch digest, state root and proof verification result.

The verifier re-executes the published batch from the previous state and only accepts the claim if the recomputed state root matches (`verified: true`). A claim with a forged state root is rejected (`tamperRejected: true`).

The proof is intentionally a commitment mock. It demonstrates data flow and invariants, not cryptographic soundness. Only Node.js 20+ is required.
