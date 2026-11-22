// Paso 1 · La huella de un documento: SHA-256 y Keccak-256, y qué pasa al cambiar un carácter.
import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256, sha3_256 } from '@noble/hashes/sha3.js';
import { DOCUMENTOS, hex } from './lib/comun.mjs';

const bytes = (texto) => new TextEncoder().encode(texto);
const original = DOCUMENTOS[0];
const cambiado = original.replace('nota 6.5', 'nota 6.8'); // un solo carácter distinto

console.log(`Documento: «${original}» (${bytes(original).length} bytes)`);
console.log(`  SHA-256:    ${hex(sha256(bytes(original)))}`);
console.log(`  Keccak-256: ${hex(keccak_256(bytes(original)))}`);
console.log(`  SHA3-256:   ${hex(sha3_256(bytes(original)))}`);
console.log('  (Keccak-256 es la de Ethereum; SHA3-256 es el estándar del NIST: otro relleno, otra huella)');

// Un millón de bytes también dan 32: la huella mide lo mismo sea cual sea el documento.
console.log(`\nUn documento de 1000000 bytes también da una huella de ${keccak_256(new Uint8Array(1_000_000)).length} bytes.`);

console.log(`\nDocumento cambiado: «${cambiado}»`);
console.log(`  SHA-256:    ${hex(sha256(bytes(cambiado)))}`);
console.log(`  Keccak-256: ${hex(keccak_256(bytes(cambiado)))}`);

// Cuántos de los 256 bits de la huella cambiaron por ese carácter.
const bitsDistintos = (a, b) => a.reduce((total, byte, i) => total + [...(byte ^ b[i]).toString(2)].filter((c) => c === '1').length, 0);
console.log(`\nBits distintos entre los dos documentos: ${bitsDistintos(bytes(original), bytes(cambiado))} de ${bytes(original).length * 8}`);
console.log('Bits distintos entre las dos huellas (de 256):');
console.log(`  SHA-256:    ${bitsDistintos(sha256(bytes(original)), sha256(bytes(cambiado)))}`);
console.log(`  Keccak-256: ${bitsDistintos(keccak_256(bytes(original)), keccak_256(bytes(cambiado)))}`);

// La huella como identificador: un índice huella → documento. Verificar es recalcular y buscar.
const indice = new Map(DOCUMENTOS.map((texto) => [hex(keccak_256(bytes(texto))), texto]));
const buscar = (texto) => indice.get(hex(keccak_256(bytes(texto)))) ?? 'no está';
console.log(`\nÍndice con ${indice.size} documentos, buscados por su huella Keccak-256:`);
console.log(`  el original: ${buscar(original) === original ? 'encontrado' : 'no está'}`);
console.log(`  el cambiado: ${buscar(cambiado)}`);
console.log('\n✔ Una huella de 32 bytes identifica al documento: un carácter distinto da otra huella.');
