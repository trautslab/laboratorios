// Paso 4 · De la llave pública a la dirección: Keccak-256 de X ‖ Y, los últimos 20 bytes.
import { GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { publicKeyToAddress } from 'viem/accounts';

// Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
const kms = new KMSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ALIAS = 'alias/ruta-kms-llave-y-direccion';
const hex = (bytes) => Buffer.from(bytes).toString('hex');

// EIP-55: se hashea el texto de la dirección en minúsculas (sin 0x). Cada letra pasa a mayúscula
// si el dígito del hash que está en su misma posición es 8 o más. Los 20 bytes no cambian.
function conMayusculasDeControl(digitos) {
  const hash = hex(keccak_256(new TextEncoder().encode(digitos)));
  return '0x' + [...digitos].map((letra, i) => (parseInt(hash[i], 16) >= 8 ? letra.toUpperCase() : letra)).join('');
}

try {
  const { PublicKey: der } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  const xy = der.subarray(-64); // el punto sin su primer byte, el 04
  const hash = keccak_256(xy);
  const ultimos20 = hash.subarray(-20);
  const direccion = conMayusculasDeControl(hex(ultimos20));

  console.log(`Entrada: X ‖ Y, ${xy.length} bytes (el punto sin el 04)`);
  console.log(`≈ X ‖ Y: 0x${hex(xy)}`);
  console.log(`Keccak-256 de esos ${xy.length} bytes: ${hash.length} bytes`);
  console.log(`≈ Hash: 0x${hex(hash)}`);
  console.log(`La dirección son los últimos ${ultimos20.length} bytes del hash`);
  console.log(`≈ En minúsculas: 0x${hex(ultimos20)}`);
  console.log(`≈ Con mayúsculas de control (EIP-55): ${direccion}`);

  // La librería hace el mismo cálculo a partir de 04 ‖ X ‖ Y.
  const conLibreria = publicKeyToAddress(`0x${hex(der.subarray(-65))}`);
  console.log(`La librería calcula la misma dirección: ${conLibreria === direccion ? 'sí' : 'no'}`);
  console.log('\n✔ La dirección se calcula: no hay que registrarla en ningún sitio ni ver la llave privada.');
} catch (error) {
  if (error.name === 'NotFoundException') console.error(`✖ No existe ${ALIAS}. Corre antes el paso 1: node kms-llave-y-direccion/1-crear-llave.mjs`);
  else console.error('✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0');
  process.exit(1);
}
