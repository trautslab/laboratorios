// Paso 2 · Preguntarle al KMS qué sabe de la llave. Responde con datos SOBRE ella, no con ella.
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';

// Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
const kms = new KMSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ALIAS = 'alias/ruta-kms-llave-y-direccion';

try {
  // El alias sirve de identificador en cualquier operación: no hace falta guardar el KeyId.
  const { KeyMetadata: llave } = await kms.send(new DescribeKeyCommand({ KeyId: ALIAS }));

  console.log(`DescribeKey ${ALIAS}\n`);
  console.log(`≈ KeyId: ${llave.KeyId}`);
  console.log(`≈ Arn: ${llave.Arn}`);
  console.log(`KeySpec: ${llave.KeySpec}`);
  console.log(`KeyUsage: ${llave.KeyUsage}`);
  console.log(`SigningAlgorithms: ${llave.SigningAlgorithms.join(', ')}`);
  console.log(`KeyState: ${llave.KeyState}`);
  console.log(`Origin: ${llave.Origin}`);
  console.log(`KeyManager: ${llave.KeyManager}`);
  console.log('\n✔ Curva, uso, algoritmo y estado. La llave privada no viene en la respuesta.');
} catch (error) {
  if (error.name === 'NotFoundException') console.error(`✖ No existe ${ALIAS}. Corre antes el paso 1: node kms-llave-y-direccion/1-crear-llave.mjs`);
  else console.error('✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0');
  process.exit(1);
}
