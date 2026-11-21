// Paso 5 · El techo no es el precio: la misma transferencia con tres techos distintos.
import { createPublicClient, createWalletClient, formatGwei, http, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const transport = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport });
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const cuenta0 = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const billetera = createWalletClient({ account: cuenta0, chain: anvil, transport });

// La misma transferencia de 1 ETH; solo cambian el techo y la propina (en gwei).
const transferencia = (techo, propina) => ({
  to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  value: parseEther('1'),
  maxFeePerGas: parseGwei(techo),
  maxPriorityFeePerGas: parseGwei(propina),
});

// Envía la transferencia y muestra qué se cobró de verdad.
async function enviar(techo, propina) {
  const hash = await billetera.sendTransaction(transferencia(techo, propina));
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  const bloque = await cadena.getBlock({ blockNumber: recibo.blockNumber });
  const base = bloque.baseFeePerGas;
  console.log(`Techo ${techo} gwei, propina ${propina} gwei → bloque ${bloque.number}`);
  console.log(`  Base fee del bloque:        ${formatGwei(base)} gwei`);
  console.log(`  Base fee + propina pedida:  ${formatGwei(base + parseGwei(propina))} gwei`);
  console.log(`  Precio efectivo:            ${formatGwei(recibo.effectiveGasPrice)} gwei`);
  console.log(`  Propina que se cobró:       ${formatGwei(recibo.effectiveGasPrice - base)} gwei`);
  console.log(`  Comisión pagada:            ${formatGwei(recibo.gasUsed * recibo.effectiveGasPrice)} gwei`);
  console.log(`  Techo × gas usado:          ${formatGwei(recibo.gasUsed * parseGwei(techo))} gwei`);
}

try {
  await enviar('500', '2'); // techo muy por encima de base fee + propina
  console.log('');
  await enviar('2.5', '2'); // techo entre la base fee y base fee + propina
  console.log('');
  // Techo por debajo de la base fee: la cadena no acepta la transacción.
  const motivo = await billetera.sendTransaction(transferencia('0.5', '0.1')).catch((error) => error.details);
  console.log(`Techo 0.5 gwei, propina 0.1 gwei → rechazada: ${motivo}`);
  console.log('\n✔ Pagas base fee del bloque + propina, nunca más que el techo. El techo no es el precio.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
