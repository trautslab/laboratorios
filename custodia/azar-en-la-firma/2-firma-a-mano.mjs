// Paso 2 · La firma escrita a mano, con el número secreto k como parámetro.
import { invert, mod } from '@noble/curves/abstract/modular.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

const LLAVE = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // cuenta de prueba 0 de Anvil: pública
const N = secp256k1.Point.Fn.ORDER; // n: cuántos puntos tiene la curva. Todas las cuentas son módulo n.
const hex = (numero) => numero.toString(16).padStart(64, '0');
const dividir = (a, b) => mod(a * invert(mod(b, N), N), N); // a / b módulo n

// Firmar son dos cuentas. z es el hash del mensaje, d la llave privada y k el número secreto.
function firmarConK(z, d, k) {
  const punto = secp256k1.Point.BASE.multiply(k).toAffine(); // k veces el punto base de la curva
  const r = mod(punto.x, N); // r sale solo de k
  let s = dividir(z + r * d, k); // s mezcla el mensaje, la llave y k
  if (s > N / 2n) s = N - s; // Ethereum solo acepta la mitad baja de s
  return { r, s };
}

const hashBytes = keccak_256(new TextEncoder().encode('retiro 1: 5 ETH a la cuenta A'));
const z = BigInt(`0x${bytesToHex(hashBytes)}`);
const d = BigInt(`0x${LLAVE}`);

// La firma de la librería, como dos números.
const firma = secp256k1.sign(hashBytes, hexToBytes(LLAVE), { prehash: false });
const r = BigInt(`0x${bytesToHex(firma.slice(0, 32))}`);
const s = BigInt(`0x${bytesToHex(firma.slice(32))}`);
console.log(`Firma de la librería\n  r = 0x${hex(r)}\n  s = 0x${hex(s)}`);

// La librería no muestra su k. Quien tiene la llave lo puede despejar de la firma: k = (z + r·d) / s.
const kLibreria = dividir(z + r * d, s);
const aMano = firmarConK(z, d, kLibreria);
console.log(`\nEl k de esa firma, despejado con la llave: 0x${hex(kLibreria)}`);
console.log(`Firma a mano con ese k\n  r = 0x${hex(aMano.r)}\n  s = 0x${hex(aMano.s)}`);
console.log(`Igual a la de la librería: ${aMano.r === r && aMano.s === s ? 'sí' : 'no'}`);

// Con cualquier otro k sale otra firma, y es igual de válida.
const otroK = 0x1111111111111111111111111111111111111111111111111111111111111111n;
const otra = firmarConK(z, d, otroK);
const valida = secp256k1.verify(hexToBytes(hex(otra.r) + hex(otra.s)), hashBytes, secp256k1.getPublicKey(hexToBytes(LLAVE)), { prehash: false });
console.log(`\nFirma a mano con otro k: 0x${hex(otroK)}\n  r = 0x${hex(otra.r)}\n  s = 0x${hex(otra.s)}`);
console.log(`La librería la acepta como firma del mismo mensaje: ${valida ? 'sí' : 'no'}`);

console.log('\n✔ Firmar son dos cuentas con k. Quien verifica acepta cualquier k: elegirlo bien es asunto de quien firma.');
