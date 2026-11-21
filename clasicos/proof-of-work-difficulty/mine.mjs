// Proof of work: find a nonce whose SHA-256 has at least `bits` leading zero bits.
// Deterministic for a fixed block payload, so the attempts can be checked.
import { createHash } from 'node:crypto';

function leadingZeroBits(buffer) {
  let bits = 0;
  for (const byte of buffer) {
    if (byte === 0) { bits += 8; continue; }
    return bits + Math.clz32(byte) - 24;
  }
  return bits;
}

export function mine(payload, bits) {
  for (let nonce = 0; ; nonce += 1) {
    const hash = createHash('sha256').update(`${payload}|${nonce}`).digest();
    if (leadingZeroBits(hash) >= bits) return { nonce, attempts: nonce + 1, hash: hash.toString('hex') };
  }
}

const payload = 'prev=00ab|txs=3|height=42';
const report = [8, 12, 16].map((bits) => {
  const result = mine(payload, bits);
  const expected = 2 ** bits;
  return { bits, expectedAttempts: expected, attempts: result.attempts, ratio: Number((result.attempts / expected).toFixed(2)), hash: result.hash.slice(0, 16) };
});
console.log(JSON.stringify({ lab: 'proof-of-work-difficulty', step: 'mine', report }, null, 2));
// Every hash must meet its target; attempts stay within 20x the expectation (geometric distribution).
const ok = report.every((row) => row.ratio <= 20 && /^0+/.test(row.hash.slice(0, Math.floor(row.bits / 4))));
if (!ok) process.exit(1);
