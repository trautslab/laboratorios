// Paso 4 · Un KMS: la llave se crea dentro del servicio y no sale. Tu programa guarda un permiso.
import { CreateAliasCommand, CreateKeyCommand, DescribeKeyCommand, GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { toHex } from 'viem';

const KMS = 'http://localhost:4566'; // Floci, el emulador local
const ALIAS = 'alias/ruta-donde-vive-la-llave';
// Credenciales FICTICIAS escritas aquí a propósito: el cliente nunca mira las de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });

// Si el alias ya apunta a una llave, se usa esa. Si no, el servicio crea una: tú no le envías ninguna.
async function llaveDelAlias() {
  try {
    const { KeyMetadata } = await kms.send(new DescribeKeyCommand({ KeyId: ALIAS }));
    return [KeyMetadata, 'ya existía'];
  } catch (error) {
    if (error.name !== 'NotFoundException') throw error;
    const { KeyMetadata } = await kms.send(new CreateKeyCommand({ KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY' }));
    await kms.send(new CreateAliasCommand({ AliasName: ALIAS, TargetKeyId: KeyMetadata.KeyId }));
    return [KeyMetadata, 'creada ahora'];
  }
}

try {
  const [llave, origen] = await llaveDelAlias();
  console.log(`Lugar 4 · un KMS (emulador local en ${KMS})`);
  console.log(`  Alias:   ${ALIAS}`);
  console.log(`≈ Id de la llave: ${llave.KeyId} (${origen})`);
  console.log(`  KeySpec: ${llave.KeySpec} · KeyUsage: ${llave.KeyUsage} · Origin: ${llave.Origin}`);

  // Lo que la API entrega de la llave: la mitad pública.
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  console.log('\nPedirle la llave al servicio');
  console.log(`  GetPublicKey: ${PublicKey.length} bytes en formato DER, la mitad pública`);
  console.log(`≈ Pública: ${toHex(PublicKey)}`);
  // El SDK no trae ninguna operación para la mitad privada. Se pide a mano, con un nombre inventado.
  const cabeceras = { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': 'TrentService.GetPrivateKey' };
  const respuesta = await fetch(KMS, { method: 'POST', headers: cabeceras, body: JSON.stringify({ KeyId: ALIAS }) });
  const cuerpo = await respuesta.json();
  console.log(`  GetPrivateKey: HTTP ${respuesta.status} · ${cuerpo.__type} · ${cuerpo.message}`);

  console.log('\nDónde está la llave');
  console.log('  En tu disco: en ningún archivo.');
  console.log('  En la memoria del programa: nunca. Tiene un alias y unas credenciales.');
  console.log('✔ KMS: la llave se creó dentro del servicio. Tu programa guarda un permiso para usarla, no la llave.');
} catch (error) {
  console.error(`✖ El KMS local no respondió (${error.name}). Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0`);
  process.exit(1);
}
