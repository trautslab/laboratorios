// Lo que comparten los pasos: los ocho documentos y el árbol de Merkle. Cabe en una pantalla.
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, concatBytes } from '@noble/hashes/utils.js';

// Ocho certificados de un curso. Son el «documento» de todos los pasos.
export const DOCUMENTOS = [
  'Certificado 0041 · Ana Rojas · nota 6.5 · aprobado',
  'Certificado 0042 · Beto Díaz · nota 5.0 · aprobado',
  'Certificado 0043 · Carla Soto · nota 6.1 · aprobado',
  'Certificado 0044 · Diego Paz · nota 4.8 · aprobado',
  'Certificado 0045 · Elena Ruiz · nota 6.9 · aprobado',
  'Certificado 0046 · Fabio Gil · nota 5.7 · aprobado',
  'Certificado 0047 · Gina Vega · nota 4.2 · aprobado',
  'Certificado 0048 · Hugo Lara · nota 5.3 · aprobado',
];

export const hex = (bytes) => `0x${bytesToHex(bytes)}`;
export const corto = (bytes) => { const h = bytesToHex(bytes); return `0x${h.slice(0, 6)}…${h.slice(-4)}`; };

// La huella de un documento es su Keccak-256. La hoja del árbol es el hash de la huella:
// así lo que entra al árbol mide siempre 32 bytes y nunca se confunde con un par de nodos (64 bytes).
export const huella = (texto) => keccak_256(new TextEncoder().encode(texto));
export const hoja = (texto) => keccak_256(huella(texto));

// Un nodo es el hash de sus dos hijos, el menor primero (como MerkleProof de OpenZeppelin).
const comparar = (a, b) => { for (let i = 0; i < 32; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
export const par = (a, b) => (comparar(a, b) < 0 ? keccak_256(concatBytes(a, b)) : keccak_256(concatBytes(b, a)));

// Todos los niveles, de las hojas a la raíz. Este laboratorio usa 2, 4 u 8 hojas (potencias de 2).
export function niveles(hojas) {
  const todos = [hojas];
  while (todos.at(-1).length > 1) {
    const arriba = [];
    const nivel = todos.at(-1);
    for (let i = 0; i < nivel.length; i += 2) arriba.push(par(nivel[i], nivel[i + 1]));
    todos.push(arriba);
  }
  return todos;
}
export const raiz = (hojas) => niveles(hojas).at(-1)[0];

// La prueba de la hoja i: en cada nivel, el hermano de quien va subiendo.
export function prueba(hojas, i) {
  const hermanos = [];
  for (const nivel of niveles(hojas).slice(0, -1)) { hermanos.push(nivel[i ^ 1]); i = Math.floor(i / 2); }
  return hermanos;
}

// Verificar es subir desde la hoja con los hermanos y comparar con la raíz.
export function recalcular(hojaInicial, hermanos) {
  return hermanos.reduce((actual, hermano) => par(actual, hermano), hojaInicial);
}
