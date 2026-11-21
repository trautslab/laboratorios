// Paso 5 · Enviar el número que faltaba: las dos transacciones entran, en el orden de sus nonces.
import { createPublicClient, http, parseEther, parseGwei } from 'viem';
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

try {
  const nonce = await cadena.getTransactionCount({ address: cuenta.address });
  console.log(`Nonce de la cuenta: ${nonce}`);
  console.log(`Firmo con el nonce ${nonce}: el que faltaba.`);

  const hash = await cadena.sendRawTransaction({ serializedTransaction: await firmar(nonce, '1') });
  console.log(`Envío: aceptado · hash ${hash}`);
  const recibo = await cadena.waitForTransactionReceipt({ hash });

  // El bloque donde entró, con sus transacciones completas y en el orden en que se ejecutaron.
  const bloque = await cadena.getBlock({ blockNumber: recibo.blockNumber, includeTransactions: true });
  console.log(`\nBloque ${bloque.number}, en orden de ejecución:`);
  for (const tx of bloque.transactions) {
    console.log(`  posición ${tx.transactionIndex} · nonce ${tx.nonce} · hash ${tx.hash}`);
  }

  console.log(`\nNonce de la cuenta: ${await cadena.getTransactionCount({ address: cuenta.address })}`);
  const pool = await cadena.request({ method: 'txpool_status' });
  console.log(`Pool del nodo:      ${Number(pool.pending)} listas para el próximo bloque · ${Number(pool.queued)} en espera`);
  console.log(`\n✔ Al llegar el nonce ${nonce}, entraron ${bloque.transactions.length} transacciones en el mismo bloque: primero la de nonce menor.`);
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
