// Paso 5 · Transacción y recibo: dos preguntas distintas con el mismo hash.
import { createPublicClient, formatEther, getAddress, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash ?? '')) {
  console.error('✖ Falta el hash del paso 3. Uso: node primera-transferencia/5-transaccion.mjs 0x…');
  process.exit(1);
}

try {
  const tx = await cadena.getTransaction({ hash }); // por dentro: eth_getTransactionByHash
  const recibo = await cadena.getTransactionReceipt({ hash }); // por dentro: eth_getTransactionReceipt

  console.log('La transacción: lo que se firmó y se envió');
  console.log(`  from:  ${getAddress(tx.from)}`);
  console.log(`  to:    ${getAddress(tx.to)}`);
  console.log(`  value: ${tx.value} wei = ${formatEther(tx.value)} ETH`);
  console.log(`  r:     ${tx.r}`);
  console.log(`  s:     ${tx.s}`);

  console.log('\nEl recibo: lo que la cadena hizo con ella');
  console.log(`  status:      ${recibo.status === 'success' ? '1 (éxito)' : '0 (falló)'}`);
  console.log(`  blockNumber: ${recibo.blockNumber}`);
  console.log(`  gasUsed:     ${recibo.gasUsed}`);
  console.log('\n✔ El monto y la firma están en la transacción; el resultado y el bloque, en el recibo.');
} catch (error) {
  if (error.name?.startsWith('Transaction')) console.error(`✖ La cadena no conoce ${hash}. Repite el paso 3 y copia el hash que imprime.`);
  else console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
