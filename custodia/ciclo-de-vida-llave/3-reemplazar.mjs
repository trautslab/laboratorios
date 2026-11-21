// Paso 3 · Reemplazar: una llave de firma no se rota. Llave nueva, dirección nueva, y mover los fondos.
import { CreateAliasCommand, CreateKeyCommand, DescribeKeyCommand, EnableKeyRotationCommand, GetPublicKeyCommand, KMSClient, SignCommand, UpdateAliasCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { createPublicClient, formatEther, getAddress, hexToBytes, http, keccak256, numberToHex, parseEther, parseGwei, recoverAddress, serializeTransaction } from 'viem';
import { anvil } from 'viem/chains';

const ALIAS = 'alias/ruta-ciclo-de-vida-llave';
const ALIAS_ANTERIOR = 'alias/ruta-ciclo-de-vida-llave-anterior';
const CLIENTE = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // cuenta de prueba 1 de Anvil
const PRECIO = parseGwei('2'); // precio fijo del gas
const COMISION = 21000n * PRECIO; // lo que cuesta una transferencia: 0.000042 ETH
// Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
const kms = new KMSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const salir = (texto) => { console.error(`✖ ${texto}`); process.exit(1); };
const saldo = async (direccion) => formatEther(await cadena.getBalance({ address: direccion }));

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

// Si el alias ya existe se reapunta; si no existe, se crea.
async function apuntarAlias(alias, id) {
  try {
    await kms.send(new UpdateAliasCommand({ AliasName: alias, TargetKeyId: id }));
  } catch (error) {
    if (error.name !== 'NotFoundException') throw error;
    await kms.send(new CreateAliasCommand({ AliasName: alias, TargetKeyId: id }));
  }
}

await fetch('http://localhost:4566/_floci/health').catch(() => salir('No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0'));
await cadena.getChainId().catch(() => salir('No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil'));
const { KeyMetadata: anterior } = await kms.send(new DescribeKeyCommand({ KeyId: ALIAS })).catch(() => salir('Falta la llave del paso 1. Corre antes: node ciclo-de-vida-llave/1-crear.mjs'));

// Primer intento: pedir al servicio que rote la llave, como se hace con una llave de cifrado.
try {
  await kms.send(new EnableKeyRotationCommand({ KeyId: anterior.KeyId }));
  console.log('EnableKeyRotation sobre la llave en uso: aceptado');
} catch (error) {
  // El SDK de JavaScript escribe «UnknownError» cuando el servicio no envía texto.
  const texto = error.message === 'UnknownError' ? '(el servicio no envió texto)' : error.message;
  console.log(`EnableKeyRotation sobre la llave en uso: rechazado\n  error: ${error.name}`);
  console.log(`≈ mensaje: ${texto}`);
}

// Lo que sí existe: otra llave. Y otra llave es otra dirección.
const { KeyMetadata: nueva } = await kms.send(new CreateKeyCommand({ KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY', Description: 'ruta: ciclo de vida de una llave (reemplazo)' }));
const [dirAnterior, dirNueva] = [await direccionDe(anterior.KeyId), await direccionDe(nueva.KeyId)];
console.log(`\nLlave nueva creada · estado: ${nueva.KeyState}`);
console.log(`≈ id de la llave nueva: ${nueva.KeyId}`);
console.log(`≈ dirección anterior: ${dirAnterior}`);
console.log(`≈ dirección nueva: ${dirNueva}`);
console.log(`Otra llave, otra dirección: ${dirAnterior !== dirNueva ? 'sí' : 'no'}`);

// La única «rotación» de una llave de cuenta: una transacción, firmada por la llave anterior,
// que lleva todo el saldo a la dirección nueva. Se envía el saldo menos la comisión.
console.log(`\nAntes   · anterior ${await saldo(dirAnterior)} ETH · nueva ${await saldo(dirNueva)} ETH`);
const monto = (await cadena.getBalance({ address: dirAnterior })) - COMISION;
const traslado = await enviarConKms(anterior.KeyId, dirNueva, monto);
console.log(`Traslado de ${formatEther(monto)} ETH firmado por la llave anterior · comisión ${formatEther(COMISION)} ETH · recibo: status ${traslado.status === 'success' ? 1 : 0}`);
console.log(`Después · anterior ${await saldo(dirAnterior)} ETH · nueva ${await saldo(dirNueva)} ETH`);

// El programa que paga firma a través del alias: al reapuntarlo, sigue a la llave nueva sin cambios.
await apuntarAlias(ALIAS, nueva.KeyId);
await apuntarAlias(ALIAS_ANTERIOR, anterior.KeyId);
console.log(`\nUpdateAlias: ${ALIAS} → llave nueva`);
console.log(`${ALIAS_ANTERIOR} → llave anterior`);
const pago = await enviarConKms(ALIAS, CLIENTE, parseEther('0.1'));
console.log(`Pago de 0.1 ETH firmado con el alias · recibo: status ${pago.status === 'success' ? 1 : 0} · salió de la dirección nueva: ${getAddress(pago.from) === dirNueva ? 'sí' : 'no'}`);
console.log(`Saldos  · anterior ${await saldo(dirAnterior)} ETH · nueva ${await saldo(dirNueva)} ETH`);
console.log('\n✔ Reemplazar una llave de firma es cambiar de dirección: llave nueva, fondos trasladados y el alias apuntando a ella.');
