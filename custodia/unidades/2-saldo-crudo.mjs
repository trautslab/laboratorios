// Paso 2 · El saldo tal como llega: un entero en hexadecimal, sin punto decimal.
const NODO = 'http://127.0.0.1:8545';
const CUENTA = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // cuenta de prueba 1 de Anvil

async function preguntar(method, params) {
  const peticion = { jsonrpc: '2.0', id: 1, method, params };
  const respuesta = await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) });
  return (await respuesta.json()).result;
}

try {
  const hex = await preguntar('eth_getBalance', [CUENTA, 'latest']);
  // El texto "0x…" es un entero. BigInt lo lee completo, cifra por cifra.
  const wei = BigInt(hex);
  const unEth = 10n ** 18n; // 1 ETH = 10^18 wei
  console.log('Método:      eth_getBalance');
  console.log(`Respuesta:   "${hex}"`);
  console.log(`Como entero: ${wei} wei (${String(wei).length} cifras)`);
  console.log(`1 ETH:       ${unEth} wei (un 1 y 18 ceros)`);
  console.log(`Para ver:    ${wei / unEth} ETH y sobran ${wei % unEth} wei`);
  console.log('\n✔ La cadena guarda un entero en wei. «10000 ETH» es ese entero dividido entre 10^18.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
