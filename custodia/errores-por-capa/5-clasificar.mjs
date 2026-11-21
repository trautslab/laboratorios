// Paso 5 · Clasificar: ante un fallo, primero averigua qué capa respondió. Después decide qué hacer.
const CUENTA_0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // cuentas de prueba de Anvil
const CUENTA_1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const CAJA = '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35'; // donde la dejó 4-contrato.mjs
const RETIRAR_500 = '0xe8b1298f00000000000000000000000000000000000000000000000000000000000001f4'; // retirar(500), ya codificada
const TODO_EL_SALDO = '0x21e19e0c9bab2400000'; // 10 000 ETH en wei

// Devuelve el JSON de la respuesta, o null si no respondió nadie.
async function preguntar(method, params, puerto = 8545) {
  try {
    const peticion = { jsonrpc: '2.0', id: 1, method, params };
    const respuesta = await fetch(`http://127.0.0.1:${puerto}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) });
    return await respuesta.json();
  } catch {
    return null;
  }
}

// Tres preguntas, en orden: ¿llegó algo?, ¿trae un error y de qué familia?, ¿qué dice el recibo?
function clasificar(respuesta) {
  if (respuesta === null) return ['red', 'reintenta: más tarde o contra otro nodo'];
  const { error, result } = respuesta;
  if ([-32700, -32600, -32601, -32602].includes(error?.code)) return ['nodo', 'corrige la petición: repetirla igual falla igual'];
  if (error?.code === -32003) return ['rechazo', 'corrige los datos: monto, saldo o comisión'];
  if (error?.code === 3) return ['ejecución', 'no la envíes: fallaría en el contrato y pagarías comisión'];
  if (error) return ['sin clasificar', 'lee el message antes de decidir'];
  if (result?.status === '0x0') return ['ejecución', 'no la reenvíes igual: ya entró en un bloque y pagó comisión'];
  return ['ninguna', 'no falló'];
}

const codigo = await preguntar('eth_getCode', [CAJA, 'latest']);
if (codigo === null || codigo.result === '0x') {
  console.error('✖ Falta la cadena o el contrato de prueba. Corre `npx anvil` en otra terminal y después: node errores-por-capa/4-contrato.mjs');
  process.exit(1);
}
// Para no firmar aquí, eth_sendTransaction: Anvil guarda las llaves de sus cuentas de prueba y firma él.
const enviada = await preguntar('eth_sendTransaction', [{ from: CUENTA_0, to: CAJA, data: RETIRAR_500, gas: '0x186a0' }]);
const CASOS = [
  ['Puerto equivocado (8546)', await preguntar('eth_chainId', [], 8546)],
  ['Método que no existe', await preguntar('eth_noExiste', [])],
  ['Enviar todo el saldo', await preguntar('eth_sendTransaction', [{ from: CUENTA_1, to: CUENTA_0, value: TODO_EL_SALDO }])],
  ['Simular retirar(500)', await preguntar('eth_call', [{ from: CUENTA_0, to: CAJA, data: RETIRAR_500 }, 'latest'])],
  ['Recibo de retirar(500), ya enviada', await preguntar('eth_getTransactionReceipt', [enviada.result])],
];

for (const [nombre, respuesta] of CASOS) {
  const [capa, queHacer] = clasificar(respuesta);
  const llego = respuesta === null ? 'nada' : respuesta.error ? `error ${respuesta.error.code} "${respuesta.error.message}"` : `recibo con status "${respuesta.result.status}"`;
  console.log(`${nombre}\n  llegó: ${llego}\n  capa:  ${capa} → ${queHacer}\n`);
}
console.log('✔ La capa decide la reacción: reintentar, corregir la petición, corregir los datos o no reenviar.');
