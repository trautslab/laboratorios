// Paso 3 · Cada bloque nuevo es una confirmación más de la misma transferencia.
import { createPublicClient, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

// Confirmaciones = último bloque - bloque de la transacción + 1.
async function contar(hash) {
  const recibo = await cadena.getTransactionReceipt({ hash }); // por dentro: eth_getTransactionReceipt
  const ultimo = await cadena.getBlockNumber({ cacheTime: 0 }); // por dentro: eth_blockNumber
  return { bloque: recibo.blockNumber, ultimo, confirmaciones: ultimo - recibo.blockNumber + 1n };
}

try {
  if ((await cadena.getBlockNumber({ cacheTime: 0 })) === 0n) {
    console.error('✖ La cadena está en el bloque 0. Corre antes el paso 2: node confirmaciones/2-transferir.mjs');
    process.exit(1);
  }
  // La transferencia del paso 2 es la primera transacción del bloque 1. Un sistema real guarda el hash al enviarla.
  const { transactions: [hash] } = await cadena.getBlock({ blockNumber: 1n });
  const antes = await contar(hash);
  console.log(`Transferencia: ${hash}`);
  console.log(`Antes:   último bloque ${antes.ultimo}, confirmaciones: ${antes.confirmaciones}`);

  // anvil_mine es un método propio de Anvil: produce bloques a pedido. Aquí, uno, y va vacío.
  await cadena.request({ method: 'anvil_mine', params: ['0x1'] });
  console.log('anvil_mine: pedí un bloque');

  const despues = await contar(hash);
  console.log(`Después: último bloque ${despues.ultimo}, confirmaciones: ${despues.confirmaciones}`);
  console.log(`\n✔ La transferencia sigue en el bloque ${despues.bloque}. Lo que creció es la cadena encima de ella.`);
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
