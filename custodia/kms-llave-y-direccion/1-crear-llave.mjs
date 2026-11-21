// Paso 1 · Crear una llave de firma DENTRO del KMS y ponerle un nombre (alias).
import { CreateAliasCommand, CreateKeyCommand, DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';

// El KMS es el emulador local. Las credenciales son ficticias y van escritas aquí a propósito:
// así el cliente no busca las de tu máquina y el laboratorio no puede tocar una cuenta real.
const kms = new KMSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ALIAS = 'alias/ruta-kms-llave-y-direccion';

// Si el alias ya existe, se usa esa llave. Si no, se crea una y se le pone el alias.
async function crearOReutilizar() {
  try {
    const { KeyMetadata } = await kms.send(new DescribeKeyCommand({ KeyId: ALIAS }));
    return [KeyMetadata.KeyId, 'ya existía, se reutiliza'];
  } catch (error) {
    if (error.name !== 'NotFoundException') throw error;
  }
  // ECC_SECG_P256K1 es secp256k1, la curva de Ethereum. SIGN_VERIFY: solo firma y verifica.
  const pedido = { KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY', Description: 'Laboratorio: llave de un custodio' };
  const { KeyMetadata } = await kms.send(new CreateKeyCommand(pedido));
  await kms.send(new CreateAliasCommand({ AliasName: ALIAS, TargetKeyId: KeyMetadata.KeyId }));
  return [KeyMetadata.KeyId, 'creada ahora'];
}

try {
  const [keyId, resultado] = await crearOReutilizar();
  console.log('KMS en http://localhost:4566 (emulador local, credenciales ficticias)\n');
  console.log('Pedido: una llave ECC_SECG_P256K1 con uso SIGN_VERIFY');
  console.log(`≈ Resultado: ${resultado}`);
  console.log(`≈ Identificador: ${keyId}`);
  console.log(`Alias: ${ALIAS}`);
  console.log('\n✔ La llave privada se generó dentro del servicio. Tu programa solo conoce su nombre.');
} catch {
  console.error('✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0');
  process.exit(1);
}
