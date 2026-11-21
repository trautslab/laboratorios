// Paso 2 · Deshabilitar: la firma se detiene de inmediato y se puede volver atrás.
import { DescribeKeyCommand, DisableKeyCommand, EnableKeyCommand, GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { createPublicClient, formatEther, getAddress, http, keccak256 } from 'viem';
import { anvil } from 'viem/chains';

const ALIAS = 'alias/ruta-ciclo-de-vida-llave';
// Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
const kms = new KMSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const salir = (texto) => { console.error(`✖ ${texto}`); process.exit(1); };

// Dirección de una llave del KMS. Se explica en «Crear una llave en KMS y obtener su dirección».
async function direccionDe(llave) {
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: llave }));
  return getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
}

const estadoDe = async (llave) => (await kms.send(new DescribeKeyCommand({ KeyId: llave }))).KeyMetadata.KeyState;

// Pide una firma de 32 bytes y muestra lo que respondió el servicio: la firma o el rechazo.
async function probarFirma(llave, nombre) {
  try {
    await kms.send(new SignCommand({ KeyId: llave, Message: new Uint8Array(32).fill(1), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }));
    console.log(`Firma con ${nombre}: aceptada`);
  } catch (error) {
    // El SDK de JavaScript escribe «UnknownError» cuando el servicio no envía texto.
    const texto = error.message === 'UnknownError' ? '(el servicio no envió texto)' : error.message;
    console.log(`Firma con ${nombre}: rechazada\n  error: ${error.name}`);
    console.log(`≈ mensaje: ${texto}`);
  }
}

await fetch('http://localhost:4566/_floci/health').catch(() => salir('No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0'));
await cadena.getChainId().catch(() => salir('No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil'));
// El alias dice qué llave está en uso. Los cambios de estado se piden con el id de la llave.
const { KeyMetadata: llave } = await kms.send(new DescribeKeyCommand({ KeyId: ALIAS })).catch(() => salir('Falta la llave del paso 1. Corre antes: node ciclo-de-vida-llave/1-crear.mjs'));
const direccion = await direccionDe(llave.KeyId);

console.log(`Estado: ${llave.KeyState}`);
await probarFirma(ALIAS, 'el alias');

await kms.send(new DisableKeyCommand({ KeyId: llave.KeyId }));
console.log(`\nDisableKey → estado: ${await estadoDe(llave.KeyId)}`);
await probarFirma(ALIAS, 'el alias');
console.log(`Saldo de la dirección: ${formatEther(await cadena.getBalance({ address: direccion }))} ETH. La cadena no se entera: los fondos siguen ahí.`);

await kms.send(new EnableKeyCommand({ KeyId: llave.KeyId }));
console.log(`\nEnableKey → estado: ${await estadoDe(llave.KeyId)}`);
await probarFirma(ALIAS, 'el alias');
console.log('\n✔ Deshabilitar detiene la firma al instante y no destruye nada: con EnableKey la misma llave vuelve a firmar.');
