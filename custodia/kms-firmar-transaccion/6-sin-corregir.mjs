// Paso 6 · La misma firma sin cada una de las dos correcciones: qué responde la cadena.
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { formatEther, getAddress, hexToBytes, keccak256, parseEther, parseGwei, recoverAddress, serializeTransaction } from 'viem';

const KMS = 'http://localhost:4566';
const NODO = 'http://127.0.0.1:8545';
const ALIAS = 'alias/ruta-kms-firmar-transaccion';
// Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const hex32 = (n) => `0x${n.toString(16).padStart(64, '0')}`;
const siNo = (valor) => (valor ? 'sí' : 'no');
const salir = (mensaje) => { console.error(mensaje); process.exit(1); };

// Las preguntas van a mano para ver la respuesta del nodo tal cual, sin el texto que añade la librería.
async function preguntar(method, params) {
  const peticion = { jsonrpc: '2.0', id: 1, method, params };
  return (await fetch(NODO, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(peticion) })).json();
}

// La siguiente transferencia de la misma cuenta: la del paso 5 con nonce 1.
const transaccion = { chainId: 31337, nonce: 1, maxPriorityFeePerGas: parseGwei('1'), maxFeePerGas: parseGwei('2'), gas: 21000n, to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', value: parseEther('0.25') };
const hash = keccak256(serializeTransaction(transaccion));

// La firma de KMS, corregida como en el paso 5: r, s baja y su yParity.
let direccion, r, s, yParity;
try {
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  direccion = getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
  const { Signature } = await kms.send(new SignCommand({ KeyId: ALIAS, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }));
  ({ r, s } = secp256k1.Signature.fromBytes(Signature, 'der'));
  if (s > N / 2n) s = N - s;
  yParity = (await recoverAddress({ hash, signature: { r: hex32(r), s: hex32(s), yParity: 0 } })) === direccion ? 0 : 1;
} catch {
  salir('✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.');
}

try {
  // Error A · yParity equivocado: la firma se lee como si fuera de otra llave.
  const otraParidad = { r: hex32(r), s: hex32(s), yParity: 1 - yParity };
  const otra = await recoverAddress({ hash, signature: otraParidad });
  const saldoOtra = (await preguntar('eth_getBalance', [otra, 'latest'])).result;
  const rechazo = (await preguntar('eth_sendRawTransaction', [serializeTransaction(transaccion, otraParidad)])).error;
  console.log('Con el yParity contrario:');
  console.log(`≈ Dirección que se recupera: ${otra}`);
  console.log(`  Es la dirección de la llave: ${siNo(otra === direccion)}`);
  console.log(`  Saldo de esa dirección: ${formatEther(BigInt(saldoOtra))} ETH`);
  console.log(`  Respuesta del nodo: error ${rechazo.code} · ${rechazo.message}`);

  // Error B · s sin bajar: (r, N − s) con el yParity contrario es la misma firma en su forma alta.
  const sAlta = { r: hex32(r), s: hex32(N - s), yParity: 1 - yParity };
  const recuperada = await recoverAddress({ hash, signature: sAlta });
  const envio = await preguntar('eth_sendRawTransaction', [serializeTransaction(transaccion, sAlta)]);
  console.log('\nCon s en la mitad alta:');
  console.log(`≈ Dirección que se recupera: ${recuperada}`);
  console.log(`  Es la dirección de la llave: ${siNo(recuperada === direccion)}`);
  console.log(`  s mayor que la mitad del orden: ${siNo(N - s > N / 2n)} (EIP-2: firma inválida)`);
  console.log(`  Respuesta del nodo: ${envio.error ? `error ${envio.error.code} · ${envio.error.message}` : 'aceptada'}`);
  if (envio.result) {
    // Anvil la mina enseguida. Cuando ya está en un bloque se lee de vuelta, con la firma que quedó escrita.
    let minada;
    do minada = (await preguntar('eth_getTransactionByHash', [envio.result])).result; while (!minada?.blockNumber);
    console.log(`≈ Hash de la transacción: ${envio.result}`);
    console.log(`  Bloque: ${Number(minada.blockNumber)}`);
    console.log(`  s dentro de la transacción minada, mayor que la mitad del orden: ${siNo(BigInt(minada.s) > N / 2n)}`);
  }

  const nonce = (await preguntar('eth_getTransactionCount', [direccion, 'latest'])).result;
  console.log(`\nNonce de la dirección de KMS: ${Number(nonce)}`);
  console.log('\n✔ El yParity equivocado se nota enseguida. La s alta no: esta cadena local la dejó pasar, así que la comprobación va en tu código.');
} catch {
  salir(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
}
