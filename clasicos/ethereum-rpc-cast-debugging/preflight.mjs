import { spawnSync } from 'node:child_process';
import net from 'node:net';

const commands = ['anvil', 'cast'];
const versions = Object.fromEntries(
  commands.map((command) => {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
    return [command, { available: result.status === 0, version: (result.stdout || result.stderr || result.error?.message || '').trim().split('\n')[0] }];
  })
);

const rpcUrl = process.env.RPC_URL ?? '';
const rpcSafe = !rpcUrl || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(rpcUrl);
const portFree = await new Promise((resolve) => {
  const server = net.createServer();
  server.once('error', () => resolve(false));
  server.listen(8545, '127.0.0.1', () => server.close(() => resolve(true)));
});

const report = { versions, rpcUrl: rpcUrl || '(unset)', rpcSafe, port8545Free: portFree };
console.log(JSON.stringify(report, null, 2));

if (commands.some((command) => !versions[command].available) || !rpcSafe) process.exit(1);
