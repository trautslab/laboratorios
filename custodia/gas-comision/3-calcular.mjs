// Paso 3 · Calcular la comisión a mano y comprobarla contra el saldo de quien envió.
import { createPublicClient, formatEther, formatGwei, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const BLOQUE = 1n; // el bloque donde quedó la transferencia del paso 2

try {
  if ((await cadena.getBlockNumber()) < BLOQUE) {
    console.error('✖ La cadena sigue en el bloque 0. Corre antes el paso 2: node gas-comision/2-enviar.mjs');
    process.exit(1);
  }
  const bloque = await cadena.getBlock({ blockNumber: BLOQUE, includeTransactions: true });
  const tx = bloque.transactions[0];
  const recibo = await cadena.getTransactionReceipt({ hash: tx.hash });

  // La comisión: gas usado × precio efectivo. Todo en wei y con BigInt.
  const comision = recibo.gasUsed * recibo.effectiveGasPrice;
  console.log(`Gas usado × precio efectivo: ${recibo.gasUsed} × ${recibo.effectiveGasPrice} wei`);
  console.log(`Comisión calculada: ${comision} wei = ${formatGwei(comision)} gwei = ${formatEther(comision)} ETH`);

  // El saldo de quien envió, justo antes y justo después de ese bloque.
  const antes = await cadena.getBalance({ address: tx.from, blockNumber: BLOQUE - 1n });
  const despues = await cadena.getBalance({ address: tx.from, blockNumber: BLOQUE });
  const diferencia = antes - despues - tx.value;
  console.log('');
  console.log(`Saldo antes (bloque 0):   ${formatEther(antes)} ETH`);
  console.log(`Saldo después (bloque 1): ${formatEther(despues)} ETH`);
  console.log(`Salió de la cuenta:       ${formatEther(antes - despues)} ETH`);
  console.log(`Monto enviado:            ${formatEther(tx.value)} ETH`);
  console.log(`Diferencia:               ${diferencia} wei`);
  const igual = diferencia === comision;
  console.log(`\n${igual ? '✔ La diferencia es' : '✖ La diferencia no es'} la comisión: gas usado × precio efectivo, wei por wei.`);
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
