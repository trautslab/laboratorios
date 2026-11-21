// Paso 2 · Preguntarle a la cadena «a mano»: un POST con JSON, sin ninguna librería.
const NODO = 'http://127.0.0.1:8545';

// Toda pregunta tiene la misma forma: el nombre de un método y sus parámetros.
async function preguntar(method, params = []) {
  const peticion = { jsonrpc: '2.0', id: 1, method, params };
  const respuesta = await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) });
  const { result, error } = await respuesta.json();
  if (error) throw new Error(error.message);
  return result;
}

try {
  console.log('Petición:   {"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}');
  const chainId = await preguntar('eth_chainId');
  console.log(`Respuesta:  "${chainId}"`);
  console.log(`En decimal: ${Number(chainId)}`);
  console.log('');
  console.log(`web3_clientVersion → ${await preguntar('web3_clientVersion')}`);
  const bloque = await preguntar('eth_blockNumber');
  console.log(`eth_blockNumber    → "${bloque}" = ${Number(bloque)}`);
  console.log('\n✔ La cadena es un servicio HTTP: le preguntas con JSON y responde con JSON.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
