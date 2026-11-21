// Paso 6 · El cambio de estado: los saldos justo antes y justo después del bloque del recibo.
import { createPublicClient, formatEther, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash ?? '')) {
  console.error('✖ Falta el hash del paso 3. Uso: node primera-transferencia/6-antes-y-despues.mjs 0x…');
  process.exit(1);
}

try {
  const recibo = await cadena.getTransactionReceipt({ hash });
  const bloque = recibo.blockNumber;
  console.log(`El recibo dice: bloque ${bloque}\n`);

  // El mismo eth_getBalance de siempre, con un segundo parámetro: en qué bloque mirar.
  const saldo = (address, blockNumber) => cadena.getBalance({ address, blockNumber });
  const enviaAntes = await saldo(recibo.from, bloque - 1n);
  const enviaDespues = await saldo(recibo.from, bloque);
  const recibeAntes = await saldo(recibo.to, bloque - 1n);
  const recibeDespues = await saldo(recibo.to, bloque);

  console.log('Quien envía');
  console.log(`  antes (bloque ${bloque - 1n}):   ${formatEther(enviaAntes)} ETH`);
  console.log(`  después (bloque ${bloque}): ${formatEther(enviaDespues)} ETH`);
  console.log(`  salió:              ${formatEther(enviaAntes - enviaDespues)} ETH`);
  console.log('Quien recibe');
  console.log(`  antes (bloque ${bloque - 1n}):   ${formatEther(recibeAntes)} ETH`);
  console.log(`  después (bloque ${bloque}): ${formatEther(recibeDespues)} ETH`);
  console.log(`  entró:              ${formatEther(recibeDespues - recibeAntes)} ETH`);

  const comision = enviaAntes - enviaDespues - (recibeDespues - recibeAntes);
  console.log(`\nComisión (salió y no llegó): ${formatEther(comision)} ETH`);
  console.log('\n✔ La transferencia cambió el estado: 1 ETH cambió de cuenta y quien envía pagó la comisión.');
} catch (error) {
  if (error.name?.startsWith('Transaction')) console.error(`✖ La cadena no tiene recibo para ${hash}. Repite el paso 3 y copia el hash que imprime.`);
  else console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
