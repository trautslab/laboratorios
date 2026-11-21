// Paso 4 · Saltarse un número: el nodo guarda la transacción, pero no la incluye en ningún bloque.
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
  console.log(`Firmo con el nonce ${nonce + 1}: me salto el ${nonce}.`);

  let hash;
  try {
    hash = await cadena.sendRawTransaction({ serializedTransaction: await firmar(nonce + 1, '1') });
    console.log(`Envío: aceptado · hash ${hash}`);
  } catch (error) {
    console.log(`Envío: rechazado · error ${error.code} «${error.details}»`);
    process.exit(1);
  }

  await new Promise((listo) => setTimeout(listo, 1000));
  console.log('\nUn segundo después:');
  const recibo = await cadena.request({ method: 'eth_getTransactionReceipt', params: [hash] });
  console.log(`  Recibo:          ${recibo ? `en el bloque ${Number(recibo.blockNumber)}` : 'no hay'}`);
  console.log(`  Bloque actual:   ${await cadena.getBlockNumber({ cacheTime: 0 })}`);
  console.log(`  Nonce (latest):  ${await cadena.getTransactionCount({ address: cuenta.address, blockTag: 'latest' })}`);
  console.log(`  Nonce (pending): ${await cadena.getTransactionCount({ address: cuenta.address, blockTag: 'pending' })}`);
  // txpool_status no es parte del estándar: Anvil lo ofrece para ver qué guarda el nodo sin incluir.
  const pool = await cadena.request({ method: 'txpool_status' });
  console.log(`  Pool del nodo:   ${Number(pool.pending)} listas para el próximo bloque · ${Number(pool.queued)} en espera`);
  console.log(`\n✔ El nodo aceptó el nonce ${nonce + 1} y lo dejó en espera: no puede incluirlo hasta que llegue el ${nonce}.`);
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
