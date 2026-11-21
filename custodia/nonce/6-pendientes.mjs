// Paso 6 · `latest` y `pending`: qué cuenta cada uno cuando hay transacciones esperando un bloque.
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

// El mismo método, eth_getTransactionCount, con dos etiquetas de bloque distintas.
const nonceEn = (blockTag) => cadena.getTransactionCount({ address: cuenta.address, blockTag });
const contadores = async () => `latest ${await nonceEn('latest')} · pending ${await nonceEn('pending')}`;

try {
  // Anvil produce un bloque por transacción. Lo pausas para que esperen, como en una red real.
  await cadena.request({ method: 'evm_setAutomine', params: [false] });
  console.log('Bloques automáticos: en pausa');
  console.log(`  ${await contadores()}`);

  for (const _ of [1, 2]) {
    const nonce = await nonceEn('pending'); // el siguiente número libre, contando lo que espera
    await cadena.sendRawTransaction({ serializedTransaction: await firmar(nonce, '1') }); // sin esperar recibo: todavía no hay bloque
    console.log(`Envío con el nonce ${nonce}: aceptado, espera un bloque`);
    console.log(`  ${await contadores()}`);
  }

  await cadena.request({ method: 'anvil_mine', params: ['0x1'] });
  const bloque = await cadena.getBlock({ includeTransactions: true });
  console.log(`Pido un bloque: el ${bloque.number}, con los nonces ${bloque.transactions.map((tx) => tx.nonce).join(' y ')}, en ese orden`);
  console.log(`  ${await contadores()}`);

  await cadena.request({ method: 'evm_setAutomine', params: [true] });
  console.log('Bloques automáticos: activos otra vez');
  console.log('\n✔ `latest` cuenta lo incluido en bloques; `pending` suma lo que espera en orden. El siguiente nonce sale de `pending`.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
