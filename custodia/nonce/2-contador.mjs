// Paso 2 · El nonce es un contador por cuenta: léelo, envía una transferencia y vuelve a leerlo.
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const NODO = 'http://127.0.0.1:8545';
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const DESTINO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // cuenta de prueba 1

const cadena = createPublicClient({ chain: anvil, transport: http(NODO) });
const billetera = createWalletClient({ account: cuenta, chain: anvil, transport: http(NODO) });
const nonceDe = (address) => cadena.getTransactionCount({ address }); // por dentro: eth_getTransactionCount

try {
  console.log(`Cuenta que envía: ${cuenta.address}`);
  const antes = await nonceDe(cuenta.address);
  console.log(`Nonce antes de enviar:          ${antes}`);

  // No le pasas el nonce: la librería se lo pregunta a la cadena y lo pone en la transacción antes de firmar.
  const hash = await billetera.sendTransaction({ to: DESTINO, value: parseEther('1') });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  const enviada = await cadena.getTransaction({ hash });
  console.log(`Nonce que llevó la transacción: ${enviada.nonce}`);
  console.log(`Incluida en el bloque:          ${recibo.blockNumber}`);

  const despues = await nonceDe(cuenta.address);
  console.log(`Nonce después de enviar:        ${despues}`);
  console.log(`Nonce de la cuenta que recibió: ${await nonceDe(DESTINO)}`);
  console.log(`\n✔ El nonce cuenta lo que una cuenta envía: pasó de ${antes} a ${despues}. Recibir no lo mueve.`);
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
