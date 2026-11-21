// Paso 3 · Rechazo antes del bloque: el nodo entiende la transacción y no la admite.
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

// Llave PÚBLICA de la cuenta de prueba 1: Anvil la imprime al arrancar. Nunca la uses en una red real.
const cuenta = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
const DESTINO = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'; // cuenta de prueba 2

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const billetera = createWalletClient({ account: cuenta, chain: anvil, transport: transporte });
const estado = async () => ({
  saldo: await cadena.getBalance({ address: cuenta.address }),
  nonce: await cadena.getTransactionCount({ address: cuenta.address }),
  bloque: await cadena.getBlockNumber({ cacheTime: 0 }),
});

try {
  const antes = await estado();
  console.log(`Antes:   saldo ${formatEther(antes.saldo)} ETH · nonce ${antes.nonce}`);
  console.log(`Intento: enviar ${formatEther(antes.saldo)} ETH, todo el saldo. La comisión ya no cabe.`);
  try {
    // Por dentro: firma en tu máquina y eth_sendRawTransaction. A ese envío responde el nodo.
    const hash = await billetera.sendTransaction({ to: DESTINO, value: antes.saldo });
    console.log(`Hash:    ${hash}`);
  } catch (error) {
    // El error de viem envuelve varias capas. Al fondo está el objeto que envió el nodo.
    const delNodo = error.walk();
    console.log(`El nodo respondió con un error:\n  code:    ${delNodo.code}\n  message: ${delNodo.message}`);
    console.log('Hash:    ninguno');
  }
  const despues = await estado();
  console.log(`Después: saldo ${formatEther(despues.saldo)} ETH · nonce ${despues.nonce} · bloques nuevos ${despues.bloque - antes.bloque}`);
  console.log('\n✔ Rechazo antes del bloque: sin hash, sin recibo y sin costo. En la cadena no pasó nada.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
