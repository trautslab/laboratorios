// Paso 4 · Enviar a la red 1337 los bytes firmados para la red 31337.
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
  if (chainId === 31337) {
    console.error('✖ Este nodo es la red 31337, la misma de la firma. Cierra Anvil y corre: npx anvil --chain-id 1337');
    process.exit(1);
  }
  // Los mismos campos del paso 2: la firma sale idéntica, byte por byte.
  const firmada = await cuenta.signTransaction({ chainId: 31337, nonce: 0, to: DESTINO, value: parseEther('1'), gas: 21000n, maxFeePerGas: parseGwei('2'), maxPriorityFeePerGas: parseGwei('1') });
  console.log('Firmada para el chain id 31337:');
  console.log(firmada);
  console.log(`\nEl nodo es la red:  chain id ${chainId}`);

  const { result, error } = await preguntar('eth_sendRawTransaction', [firmada]);
  console.log('Petición:           eth_sendRawTransaction con esos bytes');
  console.log(error ? `Respuesta del nodo: error ${error.code} · ${error.message}` : `Respuesta del nodo: ${result}`);

  console.log('\nDespués del intento:');
  console.log(`  Bloque:                 ${await red.getBlockNumber()}`);
  console.log(`  Nonce de quien firmó:   ${await red.getTransactionCount({ address: cuenta.address })}`);
  console.log(`  Saldo del destinatario: ${formatEther(await red.getBalance({ address: DESTINO }))} ETH`);
  console.log(`\n✔ La red ${chainId} rechazó una firma hecha para la red 31337. No se movió nada.`);
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil --chain-id 1337`);
  process.exit(1);
}
