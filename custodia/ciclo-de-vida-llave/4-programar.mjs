// Paso 4 · Programar la destrucción: una espera obligatoria y, mientras dura, la llave no firma.
import { CreateKeyCommand, DescribeKeyCommand, EnableKeyCommand, GetPublicKeyCommand, KMSClient, ScheduleKeyDeletionCommand, SignCommand } from '@aws-sdk/client-kms';
import { createPublicClient, createWalletClient, formatEther, getAddress, http, keccak256, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const ALIAS_ANTERIOR = 'alias/ruta-ciclo-de-vida-llave-anterior';
const DIAS = 7; // el mínimo que admite la documentación de AWS KMS (de 7 a 30)
// Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
const kms = new KMSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Solo reparte ETH ficticio.
const dePrueba = createWalletClient({ account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'), chain: anvil, transport: transporte });
const salir = (texto) => { console.error(`✖ ${texto}`); process.exit(1); };

// Dirección de una llave del KMS. Se explica en «Crear una llave en KMS y obtener su dirección».
async function direccionDe(llave) {
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: llave }));
  return getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
}

await fetch('http://localhost:4566/_floci/health').catch(() => salir('No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0'));
await cadena.getChainId().catch(() => salir('No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil'));
const { KeyMetadata: anterior } = await kms.send(new DescribeKeyCommand({ KeyId: ALIAS_ANTERIOR })).catch(() => salir('Falta la llave anterior. Corre antes: node ciclo-de-vida-llave/3-reemplazar.mjs'));
if (anterior.KeyState !== 'Enabled') salir(`La llave anterior está en ${anterior.KeyState}. Corre el paso 5 o empieza de nuevo desde el paso 1.`);
// La dirección se calcula ahora: con la llave pendiente de borrado, el servicio ya no entrega su llave pública.
const direccion = await direccionDe(anterior.KeyId);
console.log(`≈ dirección anterior: ${direccion}`);

// Sondeo: ¿acepta este servicio una espera menor que el mínimo documentado? Se prueba con una llave de descarte.
const { KeyMetadata: descarte } = await kms.send(new CreateKeyCommand({ KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY', Description: 'ruta: llave de descarte' }));
const sondeo = await kms.send(new ScheduleKeyDeletionCommand({ KeyId: descarte.KeyId, PendingWindowInDays: 1 })).then(() => 'aceptado', (error) => `rechazado (${error.name})`);
console.log(`Sondeo con una llave de descarte: ScheduleKeyDeletion con 1 día → ${sondeo}`);

// La destrucción no es inmediata: se programa, y el servicio responde con la fecha.
const { DeletionDate: fecha } = await kms.send(new ScheduleKeyDeletionCommand({ KeyId: anterior.KeyId, PendingWindowInDays: DIAS }));
const { KeyMetadata: ahora } = await kms.send(new DescribeKeyCommand({ KeyId: anterior.KeyId }));
console.log(`\nScheduleKeyDeletion con ${DIAS} días sobre la llave anterior → estado: ${ahora.KeyState}`);
console.log(`≈ fecha de borrado: ${fecha.toISOString().replace('.000Z', 'Z')}`);
console.log(`Días hasta esa fecha: ${Math.round((fecha.getTime() - Date.now()) / 86_400_000)}`);

// En este estado la llave no firma, y EnableKey tampoco la recupera.
try {
  await kms.send(new SignCommand({ KeyId: anterior.KeyId, Message: new Uint8Array(32).fill(1), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }));
  console.log('Firma con la llave anterior: aceptada');
} catch (error) {
  console.log(`Firma con la llave anterior: rechazada\n  error: ${error.name}`);
  console.log(`≈ mensaje: ${error.message}`);
}
const habilitar = await kms.send(new EnableKeyCommand({ KeyId: anterior.KeyId })).then(() => 'aceptado', (error) => `rechazado (${error.name})`);
console.log(`EnableKey sobre la llave anterior: ${habilitar}`);

// La cadena no sabe nada del estado de la llave: la dirección sigue recibiendo.
const deposito = await cadena.waitForTransactionReceipt({ hash: await dePrueba.sendTransaction({ to: direccion, value: parseEther('0.05') }) });
console.log(`\nUn depósito de 0.05 ETH llega a la dirección anterior · recibo: status ${deposito.status === 'success' ? 1 : 0}`);
console.log(`Saldo de la dirección anterior: ${formatEther(await cadena.getBalance({ address: direccion }))} ETH. La única llave que puede moverlo no firma.`);
console.log('\n✔ Programar la destrucción deja la llave sin firmar durante la espera. Si la fecha llega con saldo en la dirección, ese saldo se pierde.');
