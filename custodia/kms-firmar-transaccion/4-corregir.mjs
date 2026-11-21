// Paso 4 · Las dos correcciones: s en la mitad baja y el yParity que KMS no devuelve.
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { getAddress, hexToBytes, keccak256, parseEther, parseGwei, recoverAddress, serializeTransaction } from 'viem';

const KMS = 'http://localhost:4566';
const ALIAS = 'alias/ruta-kms-firmar-transaccion';
// Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
// N es el orden de la curva secp256k1: cuántos valores distintos puede tomar s.
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const hex32 = (n) => `0x${n.toString(16).padStart(64, '0')}`;

// La transacción del paso 2 y su hash.
const transaccion = { chainId: 31337, nonce: 0, maxPriorityFeePerGas: parseGwei('1'), maxFeePerGas: parseGwei('2'), gas: 21000n, to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', value: parseEther('0.25') };
const hash = keccak256(serializeTransaction(transaccion));

try {
  // La dirección de la llave (paso 1) y una firma nueva de KMS, leída del DER con la librería.
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  const direccion = getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
  const { Signature } = await kms.send(new SignCommand({ KeyId: ALIAS, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }));
  const { r, s: sDeKms } = secp256k1.Signature.fromBytes(Signature, 'der');

  // Corrección 1 · (r, s) y (r, N − s) valen para el mismo hash. La cadena solo acepta la de s baja.
  const venia = sDeKms > N / 2n ? 'alta' : 'baja';
  const s = sDeKms > N / 2n ? N - sDeKms : sDeKms;
  console.log(`Mitad del orden de la curva: ${hex32(N / 2n)}`);
  console.log(`≈ s que devolvió KMS: ${hex32(sDeKms)}`);
  console.log(`≈ Venía en la mitad: ${venia}`);
  console.log(`≈ s que se usa: ${hex32(s)}`);
  console.log(`s queda en la mitad baja: ${s <= N / 2n ? 'sí' : 'no'}`);

  // Corrección 2 · KMS no devuelve yParity. Se prueba 0 y 1, y vale el que recupera la dirección de la llave.
  console.log('\nDirección que se recupera del hash y la firma:');
  let yParity;
  for (const candidato of [0, 1]) {
    const recuperada = await recoverAddress({ hash, signature: { r: hex32(r), s: hex32(s), yParity: candidato } });
    console.log(`≈ Con yParity ${candidato}: ${recuperada}`);
    if (recuperada === direccion) yParity = candidato;
  }
  console.log(`≈ Dirección de la llave: ${direccion}`);
  console.log(`≈ yParity de esta firma: ${yParity}`);
  console.log(`Uno de los dos recupera la dirección de la llave: ${yParity === undefined ? 'no' : 'sí'}`);
  console.log('\n✔ La firma ya tiene la forma que espera la cadena: r, s en la mitad baja y yParity.');
} catch {
  console.error('✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.');
  process.exit(1);
}
