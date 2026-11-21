// Paso 2 · La llave pública es un punto de la curva secp256k1, calculado a partir de la llave privada.
import { secp256k1 } from '@noble/curves/secp256k1.js';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// p: el módulo de las coordenadas. La curva es y² = x³ + 7, con todas las cuentas módulo p.
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;

const hex = (bytes) => Buffer.from(bytes).toString('hex');
// Llave pública = llave privada × G. G es el punto base de la curva, igual para todos.
// `false` pide la forma completa: el byte 04, después x (32 bytes) y después y (32 bytes).
const publicaDe = (llaveHex) => secp256k1.getPublicKey(Buffer.from(llaveHex, 'hex'), false);

const publica = publicaDe(LLAVE);
const x = publica.slice(1, 33);
const y = publica.slice(33, 65);
console.log(`Llave privada (32 bytes): 0x${LLAVE}`);
console.log(`Llave pública (${publica.length} bytes): prefijo ${hex(publica.slice(0, 1))}, después x, después y`);
console.log(`  x: 0x${hex(x)}`);
console.log(`  y: 0x${hex(y)}`);

// Comprobación a mano: (x, y) cumple la ecuación de la curva.
const [xn, yn] = [BigInt(`0x${hex(x)}`), BigInt(`0x${hex(y)}`)];
const izquierda = (yn * yn) % P;
const derecha = (xn * xn * xn + 7n) % P;
console.log('\n¿Es un punto de la curva y² = x³ + 7 (mod p)?');
console.log(`  y² mod p:       0x${izquierda.toString(16).padStart(64, '0')}`);
console.log(`  x³ + 7 mod p:   0x${derecha.toString(16).padStart(64, '0')}`);
console.log(`  ${izquierda === derecha ? 'Iguales: sí, es un punto de la curva.' : 'Distintos: no es un punto de la curva.'}`);

// Llaves vecinas dan puntos sin parecido. La llave 1 da el punto base G tal cual.
console.log('\nLa x de la llave pública de tres llaves vecinas:');
for (const numero of [1n, 2n, 3n]) {
  const vecina = publicaDe(numero.toString(16).padStart(64, '0'));
  console.log(`  llave ${numero} → 0x${hex(vecina.slice(1, 33))}${numero === 1n ? ' (es G)' : ''}`);
}
console.log('\n✔ La llave pública son 64 bytes: las coordenadas x, y de un punto. Sale de la llave privada, y no al revés.');
