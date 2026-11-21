// Paso 1 · La base fee: el precio mínimo de cada unidad de gas, escrito en cada bloque.
import { createPublicClient, formatGwei, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

try {
  const bloque = await cadena.getBlock({ blockTag: 'latest' }); // por dentro: eth_getBlockByNumber
  console.log(`Último bloque: ${bloque.number}`);
  console.log(`Base fee (baseFeePerGas): ${bloque.baseFeePerGas} wei = ${formatGwei(bloque.baseFeePerGas)} gwei`);
  console.log(`Gas usado en el bloque: ${bloque.gasUsed} de ${bloque.gasLimit}`);
  console.log('\n✔ La base fee no la eliges tú: viene escrita en el bloque, en wei por unidad de gas.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
