#!/usr/bin/env node
import { existsSync } from 'node:fs';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..', '..');

const requiredTemplates = [
  'clasicos/ethereum-erc20-foundry-lab/templates/foundry.toml',
  'clasicos/ethereum-erc20-foundry-lab/templates/src/LabToken.sol',
  'clasicos/ethereum-erc20-foundry-lab/templates/test/LabToken.t.sol',
];

const failures = [];
const warnings = [];

for (const binary of ['forge', 'anvil', 'cast']) {
  const result = spawnSync(binary, ['--version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.error || result.status !== 0) {
    failures.push(`${binary} is not available in PATH`);
  } else {
    const firstLine = `${result.stdout || result.stderr}`.trim().split(/\r?\n/)[0];
    console.log(`${binary}: ${firstLine}`);
  }
}

for (const artifact of requiredTemplates) {
  if (!existsSync(path.join(root, artifact))) {
    failures.push(`Missing template artifact: ${artifact}`);
  }
}

const riskyEnv = ['PRIVATE_KEY', 'MNEMONIC', 'SEED_PHRASE', 'MAINNET_RPC_URL', 'ALCHEMY_API_KEY', 'INFURA_API_KEY'];
for (const key of riskyEnv) {
  if (process.env[key]) {
    warnings.push(`${key} is set. Do not use real credentials in this local lab.`);
  }
}

const rpcUrl = process.env.RPC_URL || '';
if (/mainnet|sepolia|holesky|alchemy|infura|quicknode/i.test(rpcUrl)) {
  failures.push(`RPC_URL looks non-local: ${rpcUrl}`);
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port, timeout: 400 }, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

if (await isPortOpen(8545)) {
  warnings.push('Port 8545 is already open. That is fine if it is Anvil; otherwise choose another local port.');
}

if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (failures.length) {
  console.error('\nPreflight failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nPreflight OK: ERC-20 Foundry lab can run locally.');
