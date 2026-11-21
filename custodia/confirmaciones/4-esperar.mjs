// Paso 4 · esperar(hash, n): devolver solo cuando la transferencia tiene n confirmaciones.
import { createPublicClient, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const pausa = (ms) => new Promise((listo) => setTimeout(listo, ms));

// Mira el último bloque cuatro veces por segundo y devuelve cuando la cuenta llega a n.
async function esperar(hash, n) {
  let visto = -1n;
  for (;;) {
    const recibo = await cadena.getTransactionReceipt({ hash });
    const ultimo = await cadena.getBlockNumber({ cacheTime: 0 });
    const confirmaciones = ultimo - recibo.blockNumber + 1n;
    const listo = confirmaciones >= n; // >= y no ===: entre dos miradas puede llegar más de un bloque
    if (ultimo !== visto) console.log(`  último bloque ${ultimo}: ${confirmaciones} de ${n}, ${listo ? 'listo' : 'sigo esperando'}`);
    if (listo) return confirmaciones;
    visto = ultimo;
    await pausa(250);
  }
}

try {
  if ((await cadena.getBlockNumber({ cacheTime: 0 })) === 0n) {
    console.error('✖ La cadena está en el bloque 0. Corre antes el paso 2: node confirmaciones/2-transferir.mjs');
    process.exit(1);
  }
  // Cuántas confirmaciones pedir: 5, u otro número si lo pasas como argumento.
  const n = BigInt(process.argv[2] ?? 5);
  const { transactions: [hash] } = await cadena.getBlock({ blockNumber: 1n });
  console.log(`Transferencia: ${hash}`);
  console.log(`Pido ${n} confirmaciones.`);

  const confirmaciones = await esperar(hash, n);
  console.log(`\n✔ esperar() devolvió con ${confirmaciones} confirmaciones. Antes de eso, la transferencia estaba incluida pero no contaba como hecha.`);
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
