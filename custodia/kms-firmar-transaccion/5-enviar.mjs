// Paso 5 · El recorrido completo: armar, pedir la firma a KMS, corregirla, adjuntarla y enviar.
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { createPublicClient, formatEther, getAddress, hexToBytes, http, keccak256, parseEther, parseGwei, recoverAddress, serializeTransaction } from 'viem';

const KMS = 'http://localhost:4566';
const NODO = 'http://127.0.0.1:8545';
const ALIAS = 'alias/ruta-kms-firmar-transaccion';
const DESTINO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
// Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const hex32 = (n) => `0x${n.toString(16).padStart(64, '0')}`;
const salir = (mensaje) => { console.error(mensaje); process.exit(1); };

// 1 · La transacción sin firmar y su hash (paso 2).
const transaccion = { chainId: 31337, nonce: 0, maxPriorityFeePerGas: parseGwei('1'), maxFeePerGas: parseGwei('2'), gas: 21000n, to: DESTINO, value: parseEther('0.25') };
const hash = keccak256(serializeTransaction(transaccion));

// 2 · La dirección de la llave y la firma de KMS sobre ese hash (pasos 1 y 3).
let direccion, r, s;
try {
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  direccion = getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
  const { Signature } = await kms.send(new SignCommand({ KeyId: ALIAS, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }));
  ({ r, s } = secp256k1.Signature.fromBytes(Signature, 'der'));
} catch {
  salir('✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.');
}

// 3 · Las dos correcciones (paso 4): s a la mitad baja y el yParity que recupera la dirección.
if (s > N / 2n) s = N - s;
let firma;
for (const yParity of [0, 1]) {
  const candidata = { r: hex32(r), s: hex32(s), yParity };
  if ((await recoverAddress({ hash, signature: candidata })) === direccion) firma = candidata;
}
if (!firma) salir('✖ La firma no corresponde a la llave: no se envía nada.');

// 4 · La firma se adjunta a los mismos campos: tres valores más al final de la lista.
const firmada = serializeTransaction(transaccion, firma);
console.log(`Hash que firmó KMS: ${hash}`);
console.log(`≈ Transacción firmada: ${firmada}`);
console.log(`≈ Hash de la transacción: ${keccak256(firmada)}`);

try {
  const red = createPublicClient({ transport: http(NODO) });
  const antes = await red.getBalance({ address: direccion });
  // 5 · Enviar los bytes y esperar el recibo. Para esto no hace falta KMS: la firma ya va dentro.
  const hashTx = await red.sendRawTransaction({ serializedTransaction: firmada }).catch(() => salir('✖ La cadena no aceptó la transacción. Si ya corriste este paso, reinicia Anvil y repite el paso 1.'));
  const recibo = await red.waitForTransactionReceipt({ hash: hashTx });
  console.log('\nRecibo:');
  console.log(`  estado:    ${recibo.status}`);
  console.log(`  bloque:    ${recibo.blockNumber}`);
  console.log(`  gas usado: ${recibo.gasUsed}`);
  console.log(`≈ Remitente según la cadena: ${getAddress(recibo.from)}`);
  console.log(`El remitente es la dirección de la llave de KMS: ${getAddress(recibo.from) === direccion ? 'sí' : 'no'}`);
  console.log('\nSaldos:');
  console.log(`  dirección de KMS: ${formatEther(antes)} ETH → ${formatEther(await red.getBalance({ address: direccion }))} ETH`);
  console.log(`  destinatario:     ${formatEther(await red.getBalance({ address: DESTINO }))} ETH`);
  console.log(`  nonce de la dirección de KMS: ${await red.getTransactionCount({ address: direccion })}`);
  console.log('\n✔ La cadena aceptó una transacción firmada por una llave que tu programa nunca tuvo.');
} catch {
  salir(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
}
