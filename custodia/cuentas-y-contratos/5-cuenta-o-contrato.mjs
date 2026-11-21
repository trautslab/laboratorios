// Paso 5 · ¿Cuenta o contrato? Se decide con una sola pregunta: si la dirección tiene código.
import { createPublicClient, http, size } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

const DIRECCIONES = [
  ['Cuenta de prueba 0 ', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
  ['Dirección inventada', '0x1234567890123456789012345678901234567890'],
  ['Alcancía del paso 4', '0x8464135c8F25Da09e49BC8782676a84730C318bC'],
];

// Una dirección es un contrato si la cadena guarda código para ella.
async function cuentaOContrato(address) {
  const codigo = await cadena.getCode({ address }); // por dentro: eth_getCode
  return codigo ? `contrato, ${size(codigo)} bytes de código` : 'cuenta, sin código';
}

try {
  for (const [nombre, address] of DIRECCIONES) {
    console.log(`${nombre}: ${await cuentaOContrato(address)}`);
  }
  console.log('\n✔ Sin código, la mueve una llave (si alguien la tiene). Con código, manda el código.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
