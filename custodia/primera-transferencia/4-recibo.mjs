// Paso 4 · El recibo: la respuesta de la cadena a «¿qué pasó con este hash?».
import { createPublicClient, getAddress, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash ?? '')) {
  console.error('✖ Falta el hash del paso 3. Uso: node primera-transferencia/4-recibo.mjs 0x…');
  process.exit(1);
}
const INVENTADO = `0x${'ab'.repeat(32)}`; // tiene forma de hash, pero nadie envió esa transacción

// El nodo responde null cuando no tiene recibo. viem lo convierte en un error: aquí vuelve a ser null.
async function pedirRecibo(hash) {
  try {
    return await cadena.getTransactionReceipt({ hash }); // por dentro: eth_getTransactionReceipt
  } catch (error) {
    if (error.name === 'TransactionReceiptNotFoundError') return null;
    throw error;
  }
}

try {
  const recibo = await pedirRecibo(hash);
  if (!recibo) {
    console.error(`✖ La cadena no tiene recibo para ${hash}. Repite el paso 3 y copia el hash que imprime.`);
    process.exit(1);
  }
  console.log(`Recibo de ${hash}`);
  console.log(`  status:      ${recibo.status === 'success' ? '1 (éxito)' : '0 (falló)'}`);
  console.log(`  blockNumber: ${recibo.blockNumber}`);
  console.log(`  from:        ${getAddress(recibo.from)}`);
  console.log(`  to:          ${getAddress(recibo.to)}`);
  console.log(`  gasUsed:     ${recibo.gasUsed}`);
  console.log(`\nRecibo de un hash inventado: ${await pedirRecibo(INVENTADO)}`);
  console.log('\n✔ Con recibo y status 1, la transferencia ocurrió. Sin recibo, un hash no prueba nada.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
