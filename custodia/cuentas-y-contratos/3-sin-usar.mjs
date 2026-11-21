// Paso 3 · Una dirección que nadie usó: la cadena responde igual, con todo en cero.
const NODO = 'http://127.0.0.1:8545';
const INVENTADA = '0x1234567890123456789012345678901234567890'; // 40 dígitos tecleados sin pensar

// A mano, para ver la respuesta tal cual llega. «latest» pide el estado más reciente.
async function preguntar(method) {
  const peticion = { jsonrpc: '2.0', id: 1, method, params: [INVENTADA, 'latest'] };
  const respuesta = await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) });
  return respuesta.text();
}

try {
  const saldo = await preguntar('eth_getBalance');
  console.log(`Dirección inventada: ${INVENTADA}\n`);
  console.log(`eth_getBalance          → ${saldo}`);
  console.log(`eth_getTransactionCount → ${await preguntar('eth_getTransactionCount')}`);
  console.log(`eth_getCode             → ${await preguntar('eth_getCode')}`);
  console.log('\n✔ Ningún error: saldo 0x0, nonce 0x0 y código 0x. Una dirección no se «crea» para existir.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
