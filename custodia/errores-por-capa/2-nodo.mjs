// Paso 2 · Capa de nodo: el nodo responde, y su respuesta es un error con code y message.
const NODO = 'http://127.0.0.1:8545';

// Envía el cuerpo tal cual y devuelve el estado HTTP y el JSON de la respuesta.
async function enviar(cuerpo) {
  const respuesta = await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: cuerpo });
  return { http: respuesta.status, json: await respuesta.json() };
}

const CASOS = [
  ['Pregunta correcta', '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'],
  ['Método que no existe', '{"jsonrpc":"2.0","id":1,"method":"eth_noExiste","params":[]}'],
  ['Parámetro mal formado', '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["hola","latest"]}'],
  ['JSON cortado', '{"jsonrpc":"2.0","id":1,"method":'],
];

try {
  for (const [nombre, cuerpo] of CASOS) {
    const { http, json } = await enviar(cuerpo);
    console.log(`${nombre}\n  envío:    ${cuerpo}`);
    if (json.error) console.log(`  HTTP ${http} · error.code ${json.error.code} · error.message "${json.error.message}"\n`);
    else console.log(`  HTTP ${http} · result "${json.result}"\n`);
  }
  console.log('✔ Capa de nodo: el HTTP dice 200 las cuatro veces. El error viaja dentro del JSON.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
