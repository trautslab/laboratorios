const canonicalA = [
  { number: 1, hash: '0x01a', parent: '0x00', logs: [{ tx: '0xa1', index: 0, value: 10 }] },
  { number: 2, hash: '0x02a', parent: '0x01a', logs: [{ tx: '0xa2', index: 0, value: 20 }] },
  { number: 3, hash: '0x03a', parent: '0x02a', logs: [{ tx: '0xa3', index: 0, value: 30 }] },
];
const replacement = [
  { number: 2, hash: '0x02b', parent: '0x01a', logs: [{ tx: '0xb2', index: 0, value: 7 }] },
  { number: 3, hash: '0x03b', parent: '0x02b', logs: [{ tx: '0xb3', index: 0, value: 8 }] },
  { number: 4, hash: '0x04b', parent: '0x03b', logs: [] },
];

const blocks = new Map();
const events = new Map();
const eventKey = (block, log) => `${block.hash}:${log.tx}:${log.index}`;
const apply = (block) => {
  blocks.set(block.number, block);
  for (const log of block.logs) events.set(eventKey(block, log), { ...log, block: block.number, blockHash: block.hash });
};
canonicalA.forEach(apply);

const forkPoint = replacement[0].number;
let removed = 0;
for (const [number, block] of [...blocks]) {
  if (number >= forkPoint) {
    for (const log of block.logs) removed += events.delete(eventKey(block, log)) ? 1 : 0;
    blocks.delete(number);
  }
}
replacement.forEach(apply);
replacement.forEach(apply); // replay proves idempotent keys

const total = [...events.values()].reduce((sum, event) => sum + event.value, 0);
const report = { forkPoint, removedEvents: removed, canonicalHead: blocks.get(4).hash, storedEvents: events.size, aggregateValue: total, replaySafe: events.size === 3 };
console.log(JSON.stringify(report, null, 2));
if (report.canonicalHead !== '0x04b' || total !== 25 || !report.replaySafe) process.exit(1);
