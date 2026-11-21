// Paso 3 · Pedir la llave pública. Llega en DER: etiquetas, y al final el punto de la curva.
import { createPublicKey } from 'node:crypto';
import { GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';

// Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
const kms = new KMSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ALIAS = 'alias/ruta-kms-llave-y-direccion';
const hex = (bytes) => Buffer.from(bytes).toString('hex');

try {
  const { PublicKey: der } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  console.log(`GetPublicKey devolvió ${der.length} bytes en DER\n`);

  // DER guarda cada dato como etiqueta, largo y contenido. En una llave secp256k1 los primeros
  // 23 bytes son siempre los mismos: dicen qué viene. Los 65 que siguen son el punto.
  console.log('Etiquetas (23 bytes):');
  console.log(`  ${hex(der.subarray(0, 2)).padEnd(20)}secuencia de 86 bytes: todo lo que sigue`);
  console.log(`  ${hex(der.subarray(2, 4)).padEnd(20)}secuencia de 16 bytes: qué tipo de llave es`);
  console.log(`  ${hex(der.subarray(4, 13)).padEnd(20)}identificador: llave pública de curva elíptica`);
  console.log(`  ${hex(der.subarray(13, 20)).padEnd(20)}identificador: la curva secp256k1`);
  console.log(`  ${hex(der.subarray(20, 23)).padEnd(20)}cadena de bits de 66 bytes: un 00 (no sobran bits) y el punto`);

  const punto = der.subarray(23); // 04 ‖ X ‖ Y
  console.log(`Punto de la curva (${punto.length} bytes):`);
  console.log(`  ${hex(punto.subarray(0, 1)).padEnd(20)}punto sin comprimir: siguen X e Y, 32 bytes cada una`);
  console.log(`≈ X: 0x${hex(punto.subarray(1, 33))}`);
  console.log(`≈ Y: 0x${hex(punto.subarray(33))}`);

  // Una librería que entiende DER lee lo mismo sin contar bytes (y rechaza un punto inválido).
  const leida = createPublicKey({ key: der, format: 'der', type: 'spki' });
  console.log(`Leída con una librería: tipo ${leida.asymmetricKeyType}, curva ${leida.asymmetricKeyDetails.namedCurve}`);
  console.log('\n✔ La llave pública son dos números, X e Y. Lo demás son etiquetas.');
} catch (error) {
  if (error.name === 'NotFoundException') console.error(`✖ No existe ${ALIAS}. Corre antes el paso 1: node kms-llave-y-direccion/1-crear-llave.mjs`);
  else console.error('✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0');
  process.exit(1);
}
