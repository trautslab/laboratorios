// Paso 5 · Comprobar la dirección: KMS firma un hash y de la firma se recupera quién firmó.
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hexToBytes, keccak256, numberToHex, recoverAddress, toBytes } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

// Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
const kms = new KMSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ALIAS = 'alias/ruta-kms-llave-y-direccion';
const N = secp256k1.Point.Fn.ORDER; // el orden de la curva: cuántos puntos tiene
const hex32 = (numero) => numberToHex(numero, { size: 32 });

try {
  const { PublicKey: der } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  const direccion = publicKeyToAddress(`0x${Buffer.from(der.subarray(-65)).toString('hex')}`);
  const hash = keccak256(toBytes('hola, KMS')); // un hash fijo de 32 bytes: no es una transacción
  console.log(`≈ Dirección calculada desde la llave pública: ${direccion}`);
  console.log(`Hash de prueba (32 bytes): ${hash}\n`);

  // DIGEST: lo que se envía ya es un hash, KMS no lo vuelve a hashear. Responde con r y s en DER.
  const pedido = { KeyId: ALIAS, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' };
  const { Signature: firmaDer } = await kms.send(new SignCommand(pedido));
  let { r, s } = secp256k1.Signature.fromBytes(firmaDer, 'der');
  console.log('Sign devolvió una firma en DER: dos números, r y s');
  console.log(`≈ Largo de la firma: ${firmaDer.length} bytes`);
  console.log(`≈ r: ${hex32(r)}`);

  // Ethereum solo acepta la mitad baja de s en una transacción (EIP-2). N − s es igual de válida.
  const alta = s > N / 2n;
  if (alta) s = N - s;
  console.log(`≈ s: ${hex32(s)}`);
  console.log(`≈ s llegó en la mitad alta: ${alta ? 'sí, se cambió por N − s' : 'no'}`);

  // A la firma le falta un dato para recuperar al firmante: 0 o 1. KMS no lo da; se prueban los dos.
  let acierto = 'ninguno';
  for (const yParity of [0, 1]) {
    const recuperada = await recoverAddress({ hash, signature: { r: hex32(r), s: hex32(s), yParity } });
    console.log(`≈ Recuperada con ${yParity}: ${recuperada}`);
    if (recuperada === direccion) acierto = yParity;
  }
  console.log(`≈ Id de recuperación que acierta: ${acierto}`);
  console.log(`La dirección recuperada coincide con la calculada: ${acierto === 'ninguno' ? 'no' : 'sí'}`);
  console.log('\n✔ El KMS firma con la llave privada de esa dirección. Tú pediste una firma y no la viste.');
} catch (error) {
  if (error.name === 'NotFoundException') console.error(`✖ No existe ${ALIAS}. Corre antes el paso 1: node kms-llave-y-direccion/1-crear-llave.mjs`);
  else console.error('✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0');
  process.exit(1);
}
