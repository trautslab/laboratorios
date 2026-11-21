// Paso 4 · Con dos firmas que comparten r, cualquiera calcula k y después la llave privada.
// Este archivo no contiene la llave: solo datos que el firmante publicó.
import { invert, mod } from '@noble/curves/abstract/modular.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { privateKeyToAddress } from 'viem/accounts';

const N = secp256k1.Point.Fn.ORDER;
const hex = (numero) => numero.toString(16).padStart(64, '0');
const dividir = (a, b) => mod(a * invert(mod(b, N), N), N);
const hashDe = (mensaje) => BigInt(`0x${bytesToHex(keccak_256(new TextEncoder().encode(mensaje)))}`);

// Lo público: la dirección del firmante, los dos mensajes y las dos firmas del paso 3.
const FIRMANTE = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const z1 = hashDe('retiro 1: 5 ETH a la cuenta A');
const z2 = hashDe('retiro 2: 7 ETH a la cuenta B');
const r = 0x4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aan;
const s1 = 0x44810ab3c96b7ed77e1591a307797d04c57eecddb1174a7f1ef858d2bfc23f6fn;
const s2 = 0x5a7a9b5759099167a1105baf9f92314f1c9c2a6dae33170a5dfc792a91d187acn;

console.log(`Dirección del firmante: ${FIRMANTE}`);
console.log(`r compartido: 0x${hex(r)}`);

// Como s se publica en su mitad baja, el s2 original puede ser s2 o n − s2: hay dos candidatos.
let recuperada = null;
for (const [nombre, candidato] of [['s2', s2], ['n − s2', N - s2]]) {
  const k = dividir(z1 - z2, s1 - candidato); // k = (z1 − z2) / (s1 − s2)
  const d = dividir(s1 * k - z1, r); // d = (s1·k − z1) / r
  const direccion = privateKeyToAddress(`0x${hex(d)}`);
  const coincide = direccion === FIRMANTE;
  console.log(`\nCandidato con ${nombre}`);
  console.log(`  k = 0x${hex(k)}\n  d = 0x${hex(d)}`);
  console.log(`  dirección de d: ${direccion} (${coincide ? 'es la del firmante' : 'no es la del firmante'})`);
  if (coincide) recuperada = d;
}

if (recuperada === null) {
  console.log('\n✖ Ningún candidato da la dirección del firmante: revisa que las dos firmas tengan el mismo r.');
  process.exit(1);
}
console.log(`\nLlave privada recuperada: 0x${hex(recuperada)}`);
console.log('\n✔ Dos firmas con el mismo r y dos divisiones bastan para tener la llave. No hizo falta acceder al firmante.');
