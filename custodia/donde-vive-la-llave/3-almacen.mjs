// Paso 3 · Un almacén cifrado (Web3 Secret Storage v3): el archivo solo no alcanza, hace falta la contraseña.
import { createCipheriv, createDecipheriv, randomUUID, scryptSync } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { keccak256, serializeSignature, toHex } from 'viem';
import { privateKeyToAddress, sign } from 'viem/accounts';

const HASH = keccak256(toHex('Orden de retiro 42: 1 ETH para Ana')); // los mismos 32 bytes del paso 1
const LLAVE_DE_PRUEBA = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // n.º 0 de Anvil, PÚBLICA
const CONTRASENA = 'contrasena-de-laboratorio';
// Fijos para que el archivo salga igual en cada corrida. Un almacén real los saca del azar.
const SAL = Buffer.alloc(32, 0x11);
const IV = Buffer.alloc(16, 0x22);
const ALMACEN = new URL('./tmp/almacen.json', import.meta.url);

// De la contraseña sale una llave de 32 bytes: la primera mitad cifra, la segunda hace la MAC.
const derivar = (contrasena, { n, r, p, dklen, salt }) => scryptSync(contrasena, Buffer.from(salt, 'hex'), dklen, { N: n, r, p });
const macDe = (derivada, cifrado) => Buffer.from(keccak_256(Buffer.concat([derivada.subarray(16, 32), cifrado]))).toString('hex');

// Cifrar: scrypt, AES-128-CTR y la MAC. En el archivo no queda ni la llave ni la contraseña.
const kdfparams = { dklen: 32, n: 8192, p: 1, r: 8, salt: SAL.toString('hex') };
const derivada = derivar(CONTRASENA, kdfparams);
const cifrado = createCipheriv('aes-128-ctr', derivada.subarray(0, 16), IV).update(Buffer.from(LLAVE_DE_PRUEBA, 'hex'));
const crypto = { cipher: 'aes-128-ctr', cipherparams: { iv: IV.toString('hex') }, ciphertext: cifrado.toString('hex'), kdf: 'scrypt', kdfparams, mac: macDe(derivada, cifrado) };
mkdirSync(new URL('./tmp/', import.meta.url), { recursive: true });
writeFileSync(ALMACEN, JSON.stringify({ crypto, id: randomUUID(), version: 3 }), { mode: 0o600 });

// Abrir: derivar otra vez, comparar la MAC y solo entonces descifrar.
function abrir(almacen, contrasena) {
  const derivada = derivar(contrasena, almacen.crypto.kdfparams);
  const cifrado = Buffer.from(almacen.crypto.ciphertext, 'hex');
  if (macDe(derivada, cifrado) !== almacen.crypto.mac) throw new Error('la MAC no coincide');
  const iv = Buffer.from(almacen.crypto.cipherparams.iv, 'hex');
  return `0x${createDecipheriv('aes-128-ctr', derivada.subarray(0, 16), iv).update(cifrado).toString('hex')}`;
}

const texto = readFileSync(ALMACEN, 'utf8');
const almacen = JSON.parse(texto);
console.log('Lugar 3 · un almacén cifrado (Web3 Secret Storage, versión 3)');
console.log('  Archivo:    donde-vive-la-llave/tmp/almacen.json');
console.log(`  kdf:        ${almacen.crypto.kdf} · n ${almacen.crypto.kdfparams.n} · r ${almacen.crypto.kdfparams.r} · p ${almacen.crypto.kdfparams.p}`);
console.log(`  salt:       ${almacen.crypto.kdfparams.salt}`);
console.log(`  cipher:     ${almacen.crypto.cipher} · iv ${almacen.crypto.cipherparams.iv}`);
console.log(`  ciphertext: ${almacen.crypto.ciphertext}`);
console.log(`  mac:        ${almacen.crypto.mac}`);
console.log(`≈ id: ${almacen.id}`);
console.log(`  ¿Aparece la llave en el archivo? ${texto.includes(LLAVE_DE_PRUEBA) ? 'sí' : 'no'}`);

console.log('\nAbrir el almacén');
try {
  abrir(almacen, 'otra-contrasena');
} catch (error) {
  console.log(`  Con otra contraseña: no abre, ${error.message}`);
}
const privateKey = abrir(almacen, CONTRASENA);
console.log(`  Con la contraseña correcta: abre, ${(privateKey.length - 2) / 2} bytes de llave`);

const firma = await sign({ hash: HASH, privateKey });
console.log('\nFirmar con la llave descifrada');
console.log(`  Hash:      ${HASH}`);
console.log(`  Dirección: ${privateKeyToAddress(privateKey)}`);
console.log(`  Firma:     ${serializeSignature(firma)}`);

console.log('\nDónde está la llave');
console.log('  En el disco: cifrada. Quien copia el archivo necesita además la contraseña.');
console.log('  En la memoria del programa: en claro, desde que abre el almacén.');
console.log('✔ Almacén cifrado: el archivo solo no firma. Con la contraseña, la llave vuelve a estar en tu proceso.');
