// Difficulty retargeting: adjust every INTERVAL blocks *by height* (not by the difficulty
// value), proportionally to how long the window took, clamped to a 4x change.
const TARGET_SECONDS = 600;
const INTERVAL = 144;

// Seeded PRNG so the simulation is reproducible.
let seed = 42;
const random = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);

export function retarget(difficulty, windowSeconds) {
  const expected = TARGET_SECONDS * INTERVAL;
  const proposed = difficulty * (expected / windowSeconds);
  return Math.min(difficulty * 4, Math.max(difficulty / 4, proposed));
}

let difficulty = 1;
let hashrate = 1; // difficulty units per TARGET_SECONDS
let windowSeconds = 0;
const windows = [];
for (let height = 1; height <= INTERVAL * 12; height += 1) {
  if (height === INTERVAL * 4 + 1) hashrate = 8; // hashrate jumps 8x after window 4
  const mean = TARGET_SECONDS * (difficulty / hashrate);
  windowSeconds += -Math.log(1 - random()) * mean; // exponential block time
  if (height % INTERVAL === 0) {
    windows.push({ window: height / INTERVAL, meanBlockSeconds: Math.round(windowSeconds / INTERVAL), difficulty: Number(difficulty.toFixed(2)) });
    difficulty = retarget(difficulty, windowSeconds);
    windowSeconds = 0;
  }
}
console.log(JSON.stringify({ lab: 'proof-of-work-difficulty', step: 'retarget', windows }, null, 2));
const last = windows.at(-1).meanBlockSeconds;
const clampHeld = windows.every((w, i) => i === 0 || w.difficulty <= windows[i - 1].difficulty * 4 + 1e-9);
// After the jump the block time returns near the target, and no step exceeded the clamp.
if (!(Math.abs(last - TARGET_SECONDS) < TARGET_SECONDS * 0.25 && clampHeld)) process.exit(1);
