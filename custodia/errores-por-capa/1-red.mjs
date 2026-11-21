// Paso 1 · Capa de red: con la cadena apagada, la pregunta no llega a nadie. No hay JSON que leer.
const NODO = 'http://127.0.0.1:8545';
const peticion = { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] };

console.log(`POST ${NODO} · eth_chainId`);
try {
  const respuesta = await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) });
  // Si llegas aquí, alguien respondió: para este paso la cadena tiene que estar apagada.
  console.error(`✖ Alguien respondió (HTTP ${respuesta.status}). Cierra Anvil con Ctrl+C y repite este paso.`);
  process.exit(1);
} catch (error) {
  // fetch no devuelve una respuesta: lanza una excepción. El motivo real viene en error.cause.code.
  const rechazada = error.cause?.code === 'ECONNREFUSED';
  console.log('Respuesta HTTP: ninguna');
  console.log('JSON del nodo:  ninguno (no hay code ni message)');
  console.log(`Motivo:         ${rechazada ? 'conexión rechazada, nadie escucha en ese puerto' : 'la conexión no se completó'}`);
  console.log('\n✔ Capa de red: la pregunta no llegó a ningún nodo. El fallo lo detectó tu propia máquina.');
}
