// Paso 1 · Una llave privada es un número de 32 bytes: pídelo al azar y comprueba que sirve.
import { randomBytes } from 'node:crypto';
import { secp256k1 } from '@noble/curves/secp256k1.js';

// n es el orden de la curva secp256k1: una constante pública. Una llave válida está entre 1 y n − 1.
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

const hex = (bytes) => Buffer.from(bytes).toString('hex');
// La regla, a mano: 32 bytes leídos como un solo número, mayor que 0 y menor que n.
function sirve(bytes) {
  const numero = BigInt(`0x${hex(bytes)}`);
  return bytes.length === 32 && numero >= 1n && numero < N;
}

// 32 bytes de un generador criptográfico. Math.random() no sirve para esto.
let llave = randomBytes(32);
while (!sirve(llave)) llave = randomBytes(32); // repetir es casi imposible: menos de 1 caso en 2^127

console.log('Pido 32 bytes al azar. Eso es toda la llave privada:');
console.log(`≈ Llave generada: 0x${hex(llave)}`);
console.log(`Largo: ${llave.length} bytes (${hex(llave).length} caracteres hexadecimales)`);
console.log(`Límite n de la curva: 0x${N.toString(16)}`);
console.log(`¿Está entre 1 y n − 1? ${sirve(llave) ? 'sí' : 'no'}`);

// La misma regla con cuatro números conocidos, y lo que dice la librería de curvas de cada uno.
const texto = (ok) => (ok ? 'sirve' : 'no sirve');
console.log('\n  número   a mano     librería');
for (const [nombre, numero] of [['0', 0n], ['1', 1n], ['n − 1', N - 1n], ['n', N]]) {
  const bytes = Buffer.from(numero.toString(16).padStart(64, '0'), 'hex');
  console.log(`  ${nombre.padEnd(8)} ${texto(sirve(bytes)).padEnd(10)} ${texto(secp256k1.utils.isValidSecretKey(bytes))}`);
}
console.log('\n✔ Una llave privada es un número de 32 bytes entre 1 y n − 1. Salió de tu máquina y nadie más lo sabe.');
