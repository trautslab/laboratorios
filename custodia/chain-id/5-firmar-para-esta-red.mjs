// Paso 5 · La misma transferencia, firmada ahora para la red 1337, y enviada.
import { createPublicClient, formatEther, http, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const NODO = 'http://127.0.0.1:8545';
const DESTINO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const red = createPublicClient({ transport: http(NODO) });

// La pregunta va a mano para ver la respuesta del nodo tal cual, sin el texto que añade la librería.
async function preguntar(method, params) {
  const peticion = { jsonrpc: '2.0', id: 1, method, params };
  const respuesta = await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) });
  return respuesta.json();
}

try {
  const chainId = await red.getChainId();
  // Solo cambia un campo respecto del paso 2: chainId. La llave y todo lo demás son iguales.
  const firmada = await cuenta.signTransaction({ chainId: 1337, nonce: 0, to: DESTINO, value: parseEther('1'), gas: 21000n, maxFeePerGas: parseGwei('2'), maxPriorityFeePerGas: parseGwei('1') });
  console.log('Firmada para el chain id 1337:');
  console.log(firmada);
  console.log(`\nEl nodo es la red:  chain id ${chainId}`);

  const { result, error } = await preguntar('eth_sendRawTransaction', [firmada]);
  console.log('Petición:           eth_sendRawTransaction con esos bytes');
  console.log(error ? `Respuesta del nodo: error ${error.code} · ${error.message}` : `Respuesta del nodo: ${result}`);
  if (error) {
    console.error('✖ Esta red no la aceptó. Cierra Anvil, corre npx anvil --chain-id 1337 y repite el paso.');
    process.exit(1);
  }

  // La respuesta es el hash de la transacción. Con él se pide el recibo.
  const recibo = await red.waitForTransactionReceipt({ hash: result });
  console.log('\nDespués del envío:');
  console.log(`  Recibo:                 ${recibo.status}, bloque ${recibo.blockNumber}`);
  console.log(`  Nonce de quien firmó:   ${await red.getTransactionCount({ address: cuenta.address })}`);
  console.log(`  Saldo del destinatario: ${formatEther(await red.getBalance({ address: DESTINO }))} ETH`);
  console.log('\n✔ Misma llave y misma transferencia, con el chain id de esta red: aceptada.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil --chain-id 1337`);
  process.exit(1);
}
