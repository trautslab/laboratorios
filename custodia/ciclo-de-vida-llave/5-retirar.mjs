// Paso 5 · Cancelar a tiempo, rescatar lo que llegó y retirar la llave en orden.
import { CancelKeyDeletionCommand, DescribeKeyCommand, DisableKeyCommand, EnableKeyCommand, GetPublicKeyCommand, KMSClient, ScheduleKeyDeletionCommand, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { createPublicClient, formatEther, getAddress, hexToBytes, http, keccak256, numberToHex, parseGwei, recoverAddress, serializeTransaction } from 'viem';
import { anvil } from 'viem/chains';

const ALIAS = 'alias/ruta-ciclo-de-vida-llave';
const ALIAS_ANTERIOR = 'alias/ruta-ciclo-de-vida-llave-anterior';
const PRECIO = parseGwei('2'); // precio fijo del gas
const COMISION = 21000n * PRECIO; // lo que cuesta una transferencia: 0.000042 ETH
// Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
const kms = new KMSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const salir = (texto) => { console.error(`✖ ${texto}`); process.exit(1); };
const saldo = async (direccion) => formatEther(await cadena.getBalance({ address: direccion }));
const describir = async (llave) => (await kms.send(new DescribeKeyCommand({ KeyId: llave }))).KeyMetadata;

// Dirección de una llave del KMS. Se explica en «Crear una llave en KMS y obtener su dirección».
async function direccionDe(llave) {
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: llave }));
  return getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
}

// Transferencia firmada por una llave del KMS. Cómo la firma del KMS se convierte en la firma
// de una transacción se explica en «Firmar una transacción con KMS y enviarla».
async function enviarConKms(llave, para, valor) {
  const desde = await direccionDe(llave);
  const nonce = await cadena.getTransactionCount({ address: desde });
  const tx = { type: 'eip1559', chainId: anvil.id, nonce, to: para, value: valor, gas: 21000n, maxFeePerGas: PRECIO, maxPriorityFeePerGas: PRECIO };
  const hash = keccak256(serializeTransaction(tx));
  const { Signature } = await kms.send(new SignCommand({ KeyId: llave, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }));
  const der = secp256k1.Signature.fromBytes(Signature, 'der');
  const s = der.hasHighS() ? secp256k1.Point.CURVE().n - der.s : der.s;
  for (const yParity of [0, 1]) {
    const firma = { r: numberToHex(der.r, { size: 32 }), s: numberToHex(s, { size: 32 }), yParity };
    if ((await recoverAddress({ hash, signature: firma })) !== desde) continue;
    const enviada = await cadena.sendRawTransaction({ serializedTransaction: serializeTransaction(tx, firma) });
    return cadena.waitForTransactionReceipt({ hash: enviada });
  }
  throw new Error('La firma no corresponde a la dirección de la llave');
}

await fetch('http://localhost:4566/_floci/health').catch(() => salir('No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0'));
await cadena.getChainId().catch(() => salir('No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil'));
const anterior = await describir(ALIAS_ANTERIOR).catch(() => salir('Falta la llave anterior. Corre antes los pasos 3 y 4.'));
if (anterior.KeyState !== 'PendingDeletion') salir(`La llave anterior está en ${anterior.KeyState}, no pendiente de borrado. Corre antes: node ciclo-de-vida-llave/4-programar.mjs`);

// Mientras dure la espera, la destrucción se puede cancelar.
await kms.send(new CancelKeyDeletionCommand({ KeyId: anterior.KeyId }));
const estado = (await describir(anterior.KeyId)).KeyState;
console.log(`CancelKeyDeletion → estado: ${estado}`);
// La documentación de AWS KMS dice que la llave vuelve deshabilitada: en ese caso hay que habilitarla.
if (estado === 'Disabled') await kms.send(new EnableKeyCommand({ KeyId: anterior.KeyId }));

// 1. Detener: el programa que paga ya no usa esta llave, porque el alias apunta a otra.
const nueva = await describir(ALIAS);
const [dirAnterior, dirNueva] = [await direccionDe(anterior.KeyId), await direccionDe(nueva.KeyId)];
console.log('\nRetiro en orden:');
console.log(`  1. detener    el alias de pagos apunta a otra llave: ${nueva.KeyId !== anterior.KeyId ? 'sí' : 'no'}`);

// 2. Mover: lo que quede en la dirección sale con una firma de la llave que se retira.
const monto = (await cadena.getBalance({ address: dirAnterior })) - COMISION;
const traslado = await enviarConKms(anterior.KeyId, dirNueva, monto);
console.log(`  2. mover      ${formatEther(monto)} ETH a la dirección nueva · recibo: status ${traslado.status === 'success' ? 1 : 0}`);

// 3. Verificar: sin saldo cero no se programa nada.
const resto = await cadena.getBalance({ address: dirAnterior });
console.log(`  3. verificar  saldo de la dirección anterior: ${formatEther(resto)} ETH`);
if (resto !== 0n) salir('La dirección anterior todavía tiene saldo. No se programa la destrucción.');

// 4. Programar: primero deshabilitar, después programar la destrucción con su espera.
await kms.send(new DisableKeyCommand({ KeyId: anterior.KeyId }));
const deshabilitada = (await describir(anterior.KeyId)).KeyState;
const { DeletionDate: fecha } = await kms.send(new ScheduleKeyDeletionCommand({ KeyId: anterior.KeyId, PendingWindowInDays: 7 }));
console.log(`  4. programar  DisableKey → ${deshabilitada} · ScheduleKeyDeletion con 7 días → ${(await describir(anterior.KeyId)).KeyState}`);
console.log('  5. esperar    hasta la fecha de borrado se vigila la dirección; si llega algo, se cancela y se repite');

// Lo que el custodio guarda fuera del KMS: cuando la llave se borre, el servicio ya no responderá por ella.
console.log('\nRegistro del retiro:');
console.log(`≈ llave retirada: ${anterior.KeyId}`);
console.log(`≈ dirección retirada: ${dirAnterior}`);
console.log(`≈ llave que la reemplaza: ${nueva.KeyId}`);
console.log(`≈ dirección que la reemplaza: ${dirNueva}`);
console.log(`≈ transacción del último traslado: ${traslado.transactionHash}`);
console.log(`≈ fecha de borrado: ${fecha.toISOString().replace('.000Z', 'Z')}`);
console.log(`Saldos al cerrar · anterior ${await saldo(dirAnterior)} ETH · nueva ${await saldo(dirNueva)} ETH`);
console.log('\n✔ Retiro en orden: detener, mover, verificar saldo cero, programar y esperar. Lo que se destruye es una llave de una dirección vacía.');
