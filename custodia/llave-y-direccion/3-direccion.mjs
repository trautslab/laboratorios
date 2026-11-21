// Paso 3 · La dirección son los últimos 20 bytes del Keccak-256 de la llave pública.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256, sha3_256 } from '@noble/hashes/sha3.js';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const hex = (bytes) => Buffer.from(bytes).toString('hex');

const completa = secp256k1.getPublicKey(Buffer.from(LLAVE, 'hex'), false); // 04 + x + y
// El prefijo 04 no entra en la cuenta: el hash se calcula solo sobre x e y, 64 bytes.
const publica = completa.slice(1);
const hash = keccak_256(publica); // 32 bytes
const direccion = hash.slice(-20); // los últimos 20

console.log(`Llave pública sin el prefijo 04: ${publica.length} bytes`);
console.log(`Keccak-256 de esos bytes (${hash.length} bytes):`);
console.log(`  0x${hex(hash)}`);
console.log(`Se descartan los primeros 12: ${hex(hash.slice(0, 12))}`);
console.log(`Quedan los últimos 20:        ${hex(direccion)}`);
console.log(`Dirección: 0x${hex(direccion)}`);

// Dos errores fáciles. Los dos dan 20 bytes con forma de dirección, pero es otra dirección.
console.log('\nDos errores que dan otra dirección, que esta llave no controla:');
console.log(`  dejar el prefijo 04 (65 bytes):  0x${hex(keccak_256(completa).slice(-20))}`);
console.log(`  usar SHA3-256 en vez de Keccak:  0x${hex(sha3_256(publica).slice(-20))}`);
console.log('\n✔ La dirección se calcula: Keccak-256 de la llave pública, últimos 20 bytes. No se le pide a nadie.');
