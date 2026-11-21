// Paso 6 · Las cuatro, lado a lado: qué tiene el programa, qué hay guardado y qué se lleva quien lo copia.
import { createDecipheriv, scryptSync } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { hexToBytes, keccak256, serializeSignature, toHex } from 'viem';
import { sign } from 'viem/accounts';

const HASH = keccak256(toHex('Orden de retiro 42: 1 ETH para Ana')); // los mismos 32 bytes del paso 1
const LLAVE_DE_PRUEBA = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // n.º 0 de Anvil, PÚBLICA
const ARCHIVO = new URL('./tmp/llave.txt', import.meta.url);
const ALMACEN = new URL('./tmp/almacen.json', import.meta.url);
const CLIENTE = { endpoint: 'http://localhost:4566', region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } };
const ALIAS = 'alias/ruta-donde-vive-la-llave';

if (!existsSync(ARCHIVO) || !existsSync(ALMACEN) || !process.env.LLAVE_PRIVADA) {
  console.error('✖ Faltan el archivo, el almacén o la variable LLAVE_PRIVADA. Corre antes los pasos 1 y 3, y lanza este con la variable como en el paso 2.');
  process.exit(1);
}

// El almacén se abre como en el paso 3: scrypt, comparar la MAC y descifrar.
function abrir({ crypto }, contrasena) {
  const { n, r, p, dklen, salt } = crypto.kdfparams;
  const derivada = scryptSync(contrasena, Buffer.from(salt, 'hex'), dklen, { N: n, r, p });
  const cifrado = Buffer.from(crypto.ciphertext, 'hex');
  if (Buffer.from(keccak_256(Buffer.concat([derivada.subarray(16, 32), cifrado]))).toString('hex') !== crypto.mac) throw new Error('la MAC no coincide');
  return `0x${createDecipheriv('aes-128-ctr', derivada.subarray(0, 16), Buffer.from(crypto.cipherparams.iv, 'hex')).update(cifrado).toString('hex')}`;
}

// Por lugar: la llave que el programa consigue (o null) y el texto que queda guardado en ese lugar.
const LUGARES = [
  ['1 · archivo en claro', readFileSync(ARCHIVO, 'utf8').trim(), readFileSync(ARCHIVO, 'utf8')],
  ['2 · variable de entorno', process.env.LLAVE_PRIVADA, `LLAVE_PRIVADA=${process.env.LLAVE_PRIVADA}`],
  ['3 · almacén cifrado', abrir(JSON.parse(readFileSync(ALMACEN, 'utf8')), 'contrasena-de-laboratorio'), readFileSync(ALMACEN, 'utf8')],
  ['4 · KMS', null, JSON.stringify({ ...CLIENTE, alias: ALIAS })],
];

console.log(`Las cuatro, lado a lado. Todas firman el mismo hash: ${HASH}\n`);
for (const [nombre, privateKey, guardado] of LUGARES) {
  console.log(nombre);
  console.log(`  ¿El programa puede imprimir la llave?   ${privateKey ? 'sí' : 'no'}`);
  console.log(`  ¿Lo guardado contiene la llave en claro? ${guardado.includes(LLAVE_DE_PRUEBA) ? 'sí' : 'no'}`);
  if (privateKey) {
    console.log(`  Firma: ${serializeSignature(await sign({ hash: HASH, privateKey }))}`);
  } else {
    try {
      const peticion = { KeyId: ALIAS, Message: hexToBytes(HASH), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' };
      const { Signature } = await new KMSClient(CLIENTE).send(new SignCommand(peticion));
      console.log(`≈ Firma (DER, otra llave): ${toHex(Signature)}`);
    } catch (error) {
      console.error(`✖ El KMS no firmó (${error.name}). Corre antes el paso 4 y comprueba que el emulador está arrancado.`);
      process.exit(1);
    }
  }
}
console.log('\n✔ En tres lugares el programa termina con la llave en la mano. En el KMS solo puede pedir firmas.');
