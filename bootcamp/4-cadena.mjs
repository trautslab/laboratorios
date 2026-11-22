// Paso 4 · Una cadena permisionada mínima: tres bloques encadenados, firmados por validadores autorizados.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { concatBytes, hexToBytes } from '@noble/hashes/utils.js';
import { getAddress } from 'viem';
import { corto, hex, hoja, raiz } from './lib/comun.mjs';

// Llaves fijas de prueba (32 bytes al azar, sacados una vez). Solo A y B están autorizados.
const LLAVES = {
  'Validador A': hexToBytes('54588faf3350361f4e514c7c44f91ba27f4547542c37b931d3c9e7e939edc610'),
  'Validador B': hexToBytes('0df35d829e76752a0c83a6578e2b9d8fc40e40e2b00d985cbad9f3e040e275a7'),
  Intruso: hexToBytes('66e041329d4e8613ee290358fd35e77675114b276afda2ad7a6f0f3a12994a9e'),
};
const direccion = (pub) => getAddress(hex(keccak_256(pub.slice(1)).slice(12)));
const DIRECCION = Object.fromEntries(Object.entries(LLAVES).map(([nombre, llave]) => [nombre, direccion(secp256k1.getPublicKey(llave, false))]));
const AUTORIZADOS = [DIRECCION['Validador A'], DIRECCION['Validador B']];
// Quién firmó: se recupera la llave pública desde el hash y la firma (r, s, recovery), como en el paso 3.
const firmanteDe = (b) => direccion(secp256k1.Signature.fromBytes(b.firma, 'recovered').recoverPublicKey(hashDe(b)).toBytes(false));
const nombreDe = (dir) => Object.keys(DIRECCION).find((nombre) => DIRECCION[nombre] === dir) ?? 'desconocido';

// Cabecera: número (8 bytes) ‖ anterior (32) ‖ timestamp (8) ‖ raíz de transacciones (32) ‖ nonce (8) = 88 bytes.
const u64 = (n) => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, BigInt(n)); return b; };
const cabecera = (b) => concatBytes(u64(b.numero), b.anterior, u64(b.timestamp), b.raizTx, u64(b.nonce));
const hashDe = (b) => keccak_256(cabecera(b));

// Producir un bloque: armar la cabecera y que un validador firme su hash.
function producir(numero, anterior, transacciones, quien) {
  // Sin prueba de trabajo, el nonce no tiene nada que buscar: queda en 0, como en Ethereum desde The Merge.
  const b = { numero, anterior, timestamp: 1767225600 + 12 * numero, raizTx: raiz(transacciones.map(hoja)), nonce: 0, transacciones };
  b.firma = secp256k1.sign(hashDe(b), LLAVES[quien], { prehash: false, format: 'recovered' });
  return b;
}

const TX = [
  ['Alta del validador A', 'Alta del validador B'],
  ['Registro de la raíz 0x710c03…a403', 'Ana Rojas pide su certificado'],
  ['Elena Ruiz verifica el certificado 0045', 'Beto Díaz pide su certificado'],
];
const cadena = [];
for (let i = 0; i < 3; i++) cadena.push(producir(i, i === 0 ? new Uint8Array(32) : hashDe(cadena[i - 1]), TX[i], i === 1 ? 'Validador B' : 'Validador A'));

console.log('Validadores autorizados:');
for (const dir of AUTORIZADOS) console.log(`  ${nombreDe(dir)}: ${dir}`);
console.log(`Fuera de la lista:\n  Intruso:     ${DIRECCION.Intruso}`);
for (const b of cadena) {
  console.log(`\nBloque ${b.numero}`);
  console.log(`  anterior:  ${corto(b.anterior)}`);
  console.log(`  timestamp: ${b.timestamp}${b.numero ? ' (+12 s)' : ' (fijo, para que la salida se repita)'}`);
  console.log(`  raíz tx:   ${corto(b.raizTx)} (${b.transacciones.length} transacciones)`);
  console.log(`  nonce:     ${b.nonce}`);
  console.log(`  cabecera:  ${cabecera(b).length} bytes → hash ${corto(hashDe(b))}, firmado por ${nombreDe(firmanteDe(b))}`);
}

// El verificador recalcula todo y no confía en nada que no pueda comprobar.
function verificar(titulo, bloques) {
  console.log(`\n${titulo}`);
  let valida = true;
  bloques.forEach((b, i) => {
    const errores = [];
    const esperado = i === 0 ? new Uint8Array(32) : hashDe(bloques[i - 1]);
    if (b.numero !== i) errores.push(`número ${b.numero}, se esperaba ${i}`);
    if (hex(b.anterior) !== hex(esperado)) errores.push(`«anterior» dice ${corto(b.anterior)}, pero el bloque ${i - 1} hoy da ${corto(esperado)}`);
    if (i > 0 && b.timestamp <= bloques[i - 1].timestamp) errores.push('timestamp no avanza');
    if (hex(b.raizTx) !== hex(raiz(b.transacciones.map(hoja)))) errores.push('la raíz no corresponde a las transacciones');
    const firmante = firmanteDe(b);
    if (!AUTORIZADOS.includes(firmante)) errores.push(`firmado por ${firmante}, que no está en la lista`);
    console.log(`  bloque ${i}: ${errores.length ? `RECHAZADO: ${errores.join('; ')}` : `ok (firmó ${nombreDe(firmante)})`}`);
    valida &&= errores.length === 0;
  });
  console.log(`  → cadena ${valida ? 'válida' : 'inválida'}`);
}

verificar('Verificador, cadena tal como se produjo:', cadena);

// Alguien cambia una transacción del bloque 1 y, para disimular, recalcula su raíz. No puede volver a firmar.
const mutada = structuredClone(cadena);
mutada[1].transacciones[1] = 'Ana Rojas recibe 10 certificados';
mutada[1].raizTx = raiz(mutada[1].transacciones.map(hoja));
verificar('Bloque 1 mutado (una transacción cambiada y la raíz recalculada):', mutada);

// Un bloque bien formado, pero firmado por alguien fuera de la lista.
const intrusa = [...cadena.slice(0, 2), producir(2, hashDe(cadena[1]), TX[2], 'Intruso')];
verificar('Bloque 2 firmado por el intruso:', intrusa);
console.log('\n✔ El verificador acepta la cadena original y rechaza el bloque mutado y el del intruso.');
