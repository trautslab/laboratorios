// Paso 2 · Una transferencia con el precio del gas escrito a mano: un techo y una propina.
import { createPublicClient, createWalletClient, formatGwei, http, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const transport = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport });
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const cuenta0 = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const billetera = createWalletClient({ account: cuenta0, chain: anvil, transport });

try {
  const hash = await billetera.sendTransaction({
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // cuenta de prueba 1
    value: parseEther('1'),
    maxFeePerGas: parseGwei('5'), // techo: lo máximo que aceptas pagar por unidad de gas
    maxPriorityFeePerGas: parseGwei('2'), // propina: lo que ofreces a quien produce el bloque
  });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  const bloque = await cadena.getBlock({ blockNumber: recibo.blockNumber });

  console.log('Enviado: 1 ETH de la cuenta 0 a la cuenta 1');
  console.log('Techo   (maxFeePerGas):         5 gwei');
  console.log('Propina (maxPriorityFeePerGas): 2 gwei');
  console.log('');
  console.log(`Incluida en el bloque: ${recibo.blockNumber}`);
  console.log(`Base fee de ese bloque: ${formatGwei(bloque.baseFeePerGas)} gwei`);
  console.log(`Gas usado (gasUsed): ${recibo.gasUsed}`);
  console.log(`Precio efectivo (effectiveGasPrice): ${recibo.effectiveGasPrice} wei = ${formatGwei(recibo.effectiveGasPrice)} gwei`);
  console.log('\n✔ El recibo trae las dos cifras de la comisión: cuánto gas se usó y a qué precio.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
