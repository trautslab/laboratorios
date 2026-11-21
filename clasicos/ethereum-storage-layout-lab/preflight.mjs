import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const commands = ['forge', 'anvil', 'cast'];
const versions = Object.fromEntries(
  commands.map((command) => {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
    return [command, { available: result.status === 0, version: (result.stdout || result.stderr || result.error?.message || '').trim().split('\n')[0] }];
  })
);
const artifacts = [
  'clasicos/ethereum-storage-layout-lab/templates/foundry.toml',
  'clasicos/ethereum-storage-layout-lab/templates/src/StorageLab.sol',
  'clasicos/ethereum-storage-layout-lab/templates/test/StorageLab.t.sol',
];
const missing = artifacts.filter((artifact) => !existsSync(artifact));

console.log(JSON.stringify({ versions, missing }, null, 2));
if (commands.some((command) => !versions[command].available) || missing.length) process.exit(1);
