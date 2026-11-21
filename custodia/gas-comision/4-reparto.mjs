// Paso 4 · Seguir el dinero: qué parte de la comisión recibe alguien y qué parte no recibe nadie.
import { createPublicClient, formatEther, formatGwei, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const BLOQUE = 1n; // el bloque donde quedó la transferencia del paso 2

// Cuánto cambió el saldo de una dirección al pasar del bloque 0 al bloque 1, en wei.
async function cambio(address) {
  const antes = await cadena.getBalance({ address, blockNumber: BLOQUE - 1n });
  const despues = await cadena.getBalance({ address, blockNumber: BLOQUE });
  return despues - antes;
}
const conSigno = (wei) => (wei < 0n ? `-${formatEther(-wei)} ETH` : `+${formatEther(wei)} ETH`);

try {
  if ((await cadena.getBlockNumber()) < BLOQUE) {
    console.error('✖ La cadena sigue en el bloque 0. Corre antes el paso 2: node gas-comision/2-enviar.mjs');
    process.exit(1);
  }
  const bloque = await cadena.getBlock({ blockNumber: BLOQUE, includeTransactions: true });
  const tx = bloque.transactions[0];
  const recibo = await cadena.getTransactionReceipt({ hash: tx.hash });

  // El precio efectivo tiene dos partes: la base fee del bloque y la propina.
  const base = bloque.baseFeePerGas;
  const propina = recibo.effectiveGasPrice - base;
  console.log(`Precio efectivo: ${formatGwei(recibo.effectiveGasPrice)} gwei = ${formatGwei(base)} gwei de base fee + ${formatGwei(propina)} gwei de propina`);
  console.log(`Productor del bloque (miner): ${bloque.miner}`);

  const [envia, recibe, productor] = [await cambio(tx.from), await cambio(tx.to), await cambio(bloque.miner)];
  console.log('\nCambio de saldo entre el bloque 0 y el bloque 1:');
  console.log(`  Quien envía:  ${conSigno(envia)}`);
  console.log(`  Quien recibe: ${conSigno(recibe)}`);
  console.log(`  Productor:    ${conSigno(productor)}`);
  console.log(`  Suma:         ${conSigno(envia + recibe + productor)}`);
  console.log('');
  console.log(`Propina × gas:  ${formatGwei(propina)} gwei × ${recibo.gasUsed} = ${formatEther(propina * recibo.gasUsed)} ETH`);
  console.log(`Base fee × gas: ${formatGwei(base)} gwei × ${recibo.gasUsed} = ${formatEther(base * recibo.gasUsed)} ETH`);
  console.log('\n✔ La propina está en el saldo del productor. La base fee no está en ningún saldo: se quemó.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
