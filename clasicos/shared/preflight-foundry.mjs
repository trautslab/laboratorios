import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const lab = process.argv[2];
if (!lab || !/^[a-z0-9-]+$/.test(lab)) {
  console.error('Usage: node clasicos/shared/preflight-foundry.mjs <lab-slug>');
  process.exit(1);
}

const commands = ['forge', 'anvil', 'cast'];
const versions = Object.fromEntries(commands.map((command) => {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
  return [command, {
    available: result.status === 0,
    version: (result.stdout || result.stderr || result.error?.message || '').trim().split('\n')[0],
  }];
}));
const templateRoot = path.join('tools', 'labs', lab, 'templates');
const templateExists = existsSync(templateRoot);
const rpcUrl = process.env.RPC_URL ?? '';
const rpcSafe = !rpcUrl || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(rpcUrl);

console.log(JSON.stringify({ lab, versions, templateRoot, templateExists, rpcUrl: rpcUrl || '(unset)', rpcSafe }, null, 2));
if (commands.some((command) => !versions[command].available) || !templateExists || !rpcSafe) process.exit(1);
