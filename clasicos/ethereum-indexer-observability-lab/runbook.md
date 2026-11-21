# Replay-safe Ethereum indexer lab

Version: `2.0.44-alpha.3`

Run `node clasicos/ethereum-indexer-observability-lab/simulate-reorg.mjs`.

The simulation indexes branch A, rolls back from the fork point, applies branch B twice and proves idempotency through the `(blockHash, transactionHash, logIndex)` event identity.

Record fork point, removed events, canonical head, aggregate and replay-safe result. Only Node.js 20+ is required.
