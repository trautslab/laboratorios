// Paso 1 · Dos firmas normales: cada una lleva un r distinto, porque cada una usó un número secreto distinto.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca le envíes fondos reales.
const LLAVE = hexToBytes('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// Se firma el hash del mensaje, no el texto. La firma son 64 bytes: los 32 de r y los 32 de s.
function firmar(mensaje) {
  const hash = keccak_256(new TextEncoder().encode(mensaje));
  const firma = secp256k1.sign(hash, LLAVE, { prehash: false });
  return { r: bytesToHex(firma.slice(0, 32)), s: bytesToHex(firma.slice(32)) };
}

const mensaje1 = 'retiro 1: 5 ETH a la cuenta A';
const mensaje2 = 'retiro 2: 7 ETH a la cuenta B';
const firma1 = firmar(mensaje1);
const firma2 = firmar(mensaje2);
const otraVez = firmar(mensaje1);

console.log(`Mensaje 1: "${mensaje1}"`);
console.log(`  r = 0x${firma1.r}\n  s = 0x${firma1.s}`);
console.log(`Mensaje 2: "${mensaje2}"`);
console.log(`  r = 0x${firma2.r}\n  s = 0x${firma2.s}`);
console.log(`r distinto en las dos firmas: ${firma1.r !== firma2.r ? 'sí' : 'no'}`);

console.log('\nMensaje 1, firmado otra vez');
console.log(`  r = 0x${otraVez.r}\n  s = 0x${otraVez.s}`);
console.log(`Misma firma que la primera vez: ${otraVez.r === firma1.r && otraVez.s === firma1.s ? 'sí' : 'no'}`);

console.log('\n✔ Mensajes distintos, r distintos. El mismo mensaje da la misma firma: la librería no usa azar, calcula el número secreto.');
