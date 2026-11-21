// Paso 3 · Un firmante con el azar roto: usa el mismo k para dos mensajes distintos.
import { invert, mod } from '@noble/curves/abstract/modular.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

const LLAVE = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // cuenta de prueba 0 de Anvil: pública
const N = secp256k1.Point.Fn.ORDER;
const hex = (numero) => numero.toString(16).padStart(64, '0');
const dividir = (a, b) => mod(a * invert(mod(b, N), N), N);

// La misma función del paso 2.
function firmarConK(z, d, k) {
  const punto = secp256k1.Point.BASE.multiply(k).toAffine();
  const r = mod(punto.x, N);
  let s = dividir(z + r * d, k);
  if (s > N / 2n) s = N - s;
  return { r, s };
}

// El generador roto: en lugar de un número nuevo por firma, devuelve siempre este.
const K_REPETIDO = 0x1111111111111111111111111111111111111111111111111111111111111111n;
const d = BigInt(`0x${LLAVE}`);
const llavePublica = secp256k1.getPublicKey(hexToBytes(LLAVE));

const firmas = ['retiro 1: 5 ETH a la cuenta A', 'retiro 2: 7 ETH a la cuenta B'].map((mensaje) => {
  const hashBytes = keccak_256(new TextEncoder().encode(mensaje));
  const firma = firmarConK(BigInt(`0x${bytesToHex(hashBytes)}`), d, K_REPETIDO);
  const valida = secp256k1.verify(hexToBytes(hex(firma.r) + hex(firma.s)), hashBytes, llavePublica, { prehash: false });
  return { mensaje, ...firma, valida };
});

firmas.forEach((firma, i) => {
  console.log(`Mensaje ${i + 1}: "${firma.mensaje}"`);
  console.log(`  r = 0x${hex(firma.r)}\n  s = 0x${hex(firma.s)}`);
  console.log(`  La librería la acepta: ${firma.valida ? 'sí' : 'no'}`);
});
console.log(`\nMismo r en las dos firmas: ${firmas[0].r === firmas[1].r ? 'sí' : 'no'}`);
console.log(`Mismo s en las dos firmas: ${firmas[0].s === firmas[1].s ? 'sí' : 'no'}`);

console.log('\n✔ Las dos firmas son válidas y comparten r. Ese r repetido dice, a cualquiera que las vea, que se usó el mismo k.');
