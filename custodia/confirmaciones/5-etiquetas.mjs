// Paso 5 · Otra forma de preguntar: en vez de contar bloques, pedir el bloque latest, safe o finalized.
import { createPublicClient, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

// Pide un bloque por etiqueta y devuelve su número. Por dentro: eth_getBlockByNumber("safe", false).
async function numeroDe(etiqueta) {
  const bloque = await cadena.getBlock({ blockTag: etiqueta });
  return bloque.number;
}

async function mostrar(bloqueDeLaTransferencia) {
  console.log(`  latest    → bloque ${await numeroDe('latest')}`);
  console.log(`  safe      → bloque ${await numeroDe('safe')}`);
  const finalizado = await numeroDe('finalized');
  console.log(`  finalized → bloque ${finalizado}`);
  // La regla por etiqueta: la transferencia cuenta cuando su bloque no supera al bloque finalized.
  console.log(`  El bloque ${bloqueDeLaTransferencia} ya está finalizado: ${bloqueDeLaTransferencia <= finalizado ? 'sí' : 'no'}`);
}

try {
  if ((await cadena.getBlockNumber({ cacheTime: 0 })) === 0n) {
    console.error('✖ La cadena está en el bloque 0. Corre antes el paso 2: node confirmaciones/2-transferir.mjs');
    process.exit(1);
  }
  const { transactions: [hash] } = await cadena.getBlock({ blockNumber: 1n });
  const { blockNumber } = await cadena.getTransactionReceipt({ hash });
  console.log(`La transferencia está en el bloque ${blockNumber}.\n`);

  console.log('Ahora:');
  await mostrar(blockNumber);

  // 64 bloques de una vez ("0x40" es 64 en hexadecimal).
  await cadena.request({ method: 'anvil_mine', params: ['0x40'] });
  console.log('\nanvil_mine: pedí 64 bloques\n');

  console.log('Después:');
  await mostrar(blockNumber);
  console.log('\n✔ Anvil calcula safe y finalized restando 32 y 64 bloques a latest. En una red real los decide el consenso.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
