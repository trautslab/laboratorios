// Paso 2 · Una transferencia queda incluida en un bloque. Ese bloque es su primera confirmación.
import { createPublicClient, createWalletClient, http, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const transport = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport });
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const billetera = createWalletClient({ account: cuenta, chain: anvil, transport });

try {
  // 1 ETH a la cuenta de prueba 1. Gas y comisión fijos: en una cadena recién arrancada el hash sale siempre igual.
  const hash = await billetera.sendTransaction({
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    value: parseEther('1'),
    gas: 21000n,
    maxFeePerGas: parseGwei('2'),
    maxPriorityFeePerGas: parseGwei('1'),
  });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  const ultimo = await cadena.getBlockNumber({ cacheTime: 0 });

  console.log(`Transferencia: ${hash}`);
  console.log(`Incluida en el bloque: ${recibo.blockNumber}`);
  console.log(`Último bloque:         ${ultimo}`);
  // Confirmaciones = último bloque - bloque de la transacción + 1.
  console.log(`Confirmaciones:        ${ultimo} - ${recibo.blockNumber} + 1 = ${ultimo - recibo.blockNumber + 1n}`);
  console.log('\n✔ La transferencia está incluida: tiene 1 confirmación. Todavía no tiene ningún bloque encima.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
