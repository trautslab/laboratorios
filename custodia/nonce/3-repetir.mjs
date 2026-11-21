// Paso 3 · Firmar una vez y enviar dos: la cadena acepta el primer envío y rechaza la repetición.
import { createPublicClient, formatEther, http, keccak256, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const NODO = 'http://127.0.0.1:8545';
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const DESTINO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // cuenta de prueba 1
const cadena = createPublicClient({ chain: anvil, transport: http(NODO) });

// Firmar no toca la red: devuelve bytes. El nonce lo eliges tú; la comisión va fija y sobra para Anvil.
const firmar = (nonce, eth) =>
  cuenta.signTransaction({ chainId: 31337, type: 'eip1559', nonce, to: DESTINO, value: parseEther(eth), gas: 21000n, maxFeePerGas: parseGwei('2'), maxPriorityFeePerGas: parseGwei('1') });

// Envía bytes ya firmados. Si el nodo los rechaza, devuelve su error tal cual: código y mensaje.
async function enviar(bytes) {
  let hash;
  try {
    hash = await cadena.sendRawTransaction({ serializedTransaction: bytes }); // por dentro: eth_sendRawTransaction
  } catch (error) {
    return `rechazada · error ${error.code} «${error.details}»`;
  }
  await cadena.waitForTransactionReceipt({ hash });
  return 'aceptada';
}

async function estado() {
  const nonce = await cadena.getTransactionCount({ address: cuenta.address });
  const saldo = await cadena.getBalance({ address: DESTINO });
  return `nonce de la cuenta ${nonce} · saldo del destino ${formatEther(saldo)} ETH`;
}

try {
  const nonce = await cadena.getTransactionCount({ address: cuenta.address });
  console.log(`Antes: ${await estado()}`);

  const bytes = await firmar(nonce, '1');
  console.log(`\nFirmo una sola vez: 1 ETH al destino, con el nonce ${nonce}.`);
  console.log(`Son ${(bytes.length - 2) / 2} bytes. Su hash: ${keccak256(bytes)}`);

  console.log(`\nPrimer envío:                 ${await enviar(bytes)}`);
  console.log(`  ${await estado()}`);
  console.log(`Segundo envío, mismos bytes:  ${await enviar(bytes)}`);
  console.log(`  ${await estado()}`);

  // Una transacción distinta (otro monto, otra firma) que reutiliza el número ya gastado.
  console.log(`Otra distinta, mismo nonce ${nonce}: ${await enviar(await firmar(nonce, '5'))}`);
  console.log(`  ${await estado()}`);
  console.log('\n✔ Cada nonce se usa una sola vez: la cadena rechazó la repetición y otra transacción con ese número.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
