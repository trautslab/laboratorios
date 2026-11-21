// Paso 5 · Detección: recorrer las firmas de un firmante y avisar si un r aparece dos veces.
import { invert, mod } from '@noble/curves/abstract/modular.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const LLAVE = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // cuenta de prueba 0 de Anvil: pública
const N = secp256k1.Point.Fn.ORDER;
const hex = (numero) => numero.toString(16).padStart(64, '0');
const dividir = (a, b) => mod(a * invert(mod(b, N), N), N);
const hashDe = (texto) => BigInt(`0x${bytesToHex(keccak_256(new TextEncoder().encode(texto)))}`);

function firmarConK(z, d, k) {
  const r = mod(secp256k1.Point.BASE.multiply(k).toAffine().x, N);
  let s = dividir(z + r * d, k);
  if (s > N / 2n) s = N - s;
  return { r, s };
}

// Un generador defectuoso: sus números parecen distintos, pero vuelve a empezar cada cuatro firmas.
const generarK = (i) => hashDe(`azar ${i % 4}`);

// El registro de un firmante: seis firmas. La última es un reintento del mensaje 2.
const mensajes = [
  'retiro 1: 5 ETH a la cuenta A',
  'retiro 2: 7 ETH a la cuenta B',
  'retiro 3: 1 ETH a la cuenta C',
  'retiro 4: 2 ETH a la cuenta D',
  'retiro 5: 9 ETH a la cuenta E',
  'retiro 2: 7 ETH a la cuenta B',
];
const d = BigInt(`0x${LLAVE}`);
const registro = mensajes.map((mensaje, i) => ({ mensaje, z: hashDe(mensaje), ...firmarConK(hashDe(mensaje), d, generarK(i)) }));

// El control: solo mira datos públicos (r y el hash de cada mensaje).
function buscarRRepetido(firmas) {
  const vistos = new Map(); // r → posición de la primera firma que lo usó
  const hallazgos = [];
  firmas.forEach((firma, i) => {
    const antes = vistos.get(firma.r);
    if (antes === undefined) vistos.set(firma.r, i);
    else hallazgos.push({ primera: antes + 1, segunda: i + 1, mismoMensaje: firmas[antes].z === firma.z });
  });
  return hallazgos;
}

registro.forEach((firma, i) => console.log(`Firma ${i + 1}: r = 0x${hex(firma.r).slice(0, 16)}…  "${firma.mensaje}"`));
console.log('');
for (const h of buscarRRepetido(registro)) {
  const lectura = h.mismoMensaje ? 'mismo mensaje → es la misma firma repetida, no revela nada' : 'mensajes distintos → llave expuesta';
  console.log(`Firmas ${h.primera} y ${h.segunda}: mismo r, ${lectura}`);
}

console.log('\n✔ Un r repetido con mensajes distintos se detecta con datos públicos. Si aparece, esa llave ya no es secreta.');
