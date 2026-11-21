#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

const checks = [];

function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split(/\r?\n/)[0] ?? '',
  };
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

const anvil = commandExists('anvil');
checks.push({
  label: 'anvil disponible',
  ok: anvil.ok,
  detail: anvil.output || 'No se pudo ejecutar anvil --version',
});

const cast = commandExists('cast');
checks.push({
  label: 'cast disponible',
  ok: cast.ok,
  detail: cast.output || 'No se pudo ejecutar cast --version',
});

const portFree = await checkPort(8545);
checks.push({
  label: 'puerto 8545 libre',
  ok: portFree,
  detail: portFree ? '127.0.0.1:8545 está libre' : '127.0.0.1:8545 ya está ocupado',
});

const suspiciousEnv = ['PRIVATE_KEY', 'MNEMONIC', 'SEED_PHRASE'].filter((key) => process.env[key]);
checks.push({
  label: 'sin secretos reales obvios en entorno',
  ok: suspiciousEnv.length === 0,
  detail:
    suspiciousEnv.length === 0
      ? 'No se detectaron variables PRIVATE_KEY, MNEMONIC o SEED_PHRASE'
      : `Revisa estas variables antes del lab: ${suspiciousEnv.join(', ')}`,
});

console.log('TrautsLab Ethereum local lab preflight\n');
for (const check of checks) {
  console.log(`${check.ok ? '✓' : '✗'} ${check.label}`);
  console.log(`  ${check.detail}`);
}

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.log('\nPreflight con bloqueantes. Corrige lo marcado antes de iniciar Anvil.');
  process.exit(1);
}

console.log('\nPreflight OK. Puedes iniciar: anvil --host 127.0.0.1 --port 8545 --chain-id 31337');
