# Proof of work and difficulty retargeting

Run `node clasicos/proof-of-work-difficulty/mine.mjs` and `node clasicos/proof-of-work-difficulty/retarget.mjs`.

`mine.mjs` searches a nonce whose SHA-256 has the required leading zero bits and compares the attempts with the 2^bits expectation. `retarget.mjs` simulates block times with a seeded random source, retargets every 144 blocks by height, clamps each change to 4x, and checks that the block time returns to the target after an 8x hashrate jump. Both are deterministic fixtures: no network, no wallet, no real chain.
