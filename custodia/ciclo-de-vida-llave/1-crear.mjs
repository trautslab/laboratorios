// Paso 1 · Una llave nueva en el KMS, con dirección, fondos y una primera firma.
import { CreateAliasCommand, CreateKeyCommand, GetPublicKeyCommand, KMSClient, SignCommand, UpdateAliasCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { createPublicClient, createWalletClient, formatEther, getAddress, hexToBytes, http, keccak256, numberToHex, parseEther, parseGwei, recoverAddress, serializeTransaction } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const ALIAS = 'alias/ruta-ciclo-de-vida-llave';
const CLIENTE = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // cuenta de prueba 1 de Anvil
const PRECIO = parseGwei('2'); // precio fijo del gas: la comisión de una transferencia es 21000 × 2 gwei
// Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
const kms = new KMSClient({ endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Solo reparte ETH ficticio.
const dePrueba = createWalletClient({ account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'), chain: anvil, transport: transporte });
const salir = (texto) => { console.error(`✖ ${texto}`); process.exit(1); };

// Dirección de una llave del KMS: keccak256 de su llave pública, últimos 20 bytes.
// Se explica en «Crear una llave en KMS y obtener su dirección».
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

// El alias es el nombre fijo que usa el programa que firma. Si ya existe de una corrida anterior
// se reapunta a la llave nueva; si no existe, se crea.
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

// Una llave de firma en la curva de Ethereum. Nace en el estado Enabled.
const { KeyMetadata: llave } = await kms.send(new CreateKeyCommand({ KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY', Description: 'ruta: ciclo de vida de una llave' }));
const direccion = await direccionDe(llave.KeyId);
await apuntarAlias(ALIAS, llave.KeyId);
console.log(`Llave creada · estado: ${llave.KeyState}`);
console.log(`≈ id de la llave: ${llave.KeyId}`);
console.log(`≈ dirección: ${direccion}`);
console.log(`${ALIAS} → esa llave`);

const fondeo = await cadena.waitForTransactionReceipt({ hash: await dePrueba.sendTransaction({ to: direccion, value: parseEther('1') }) });
console.log(`Fondeo: 1 ETH de prueba a la dirección · recibo: status ${fondeo.status === 'success' ? 1 : 0}`);

// El programa que paga no conoce el id de la llave: firma a través del alias.
const pago = await enviarConKms(ALIAS, CLIENTE, parseEther('0.1'));
console.log(`Pago de 0.1 ETH firmado con el alias · recibo: status ${pago.status === 'success' ? 1 : 0}`);
console.log(`Saldo de la dirección: ${formatEther(await cadena.getBalance({ address: direccion }))} ETH (1 − 0.1 − 0.000042 de comisión)`);
console.log('\n✔ La llave firma: su dirección recibió fondos y pagó con una firma hecha dentro del KMS.');
