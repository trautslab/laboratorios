// Paso 2 · Árbol de Merkle: ocho documentos, una raíz y la prueba de que uno está dentro.
import { DOCUMENTOS, corto, hex, hoja, niveles, prueba, raiz, recalcular } from './lib/comun.mjs';

const hojas = DOCUMENTOS.map(hoja);
const titulo = (texto) => texto.split(' · ').slice(0, 2).join(' · ');
const arbol = niveles(hojas);
console.log(`Hojas: ${hojas.length} documentos → hoja = keccak256(huella del documento)`);
hojas.forEach((h, i) => console.log(`  ${i}  ${corto(h)}  ${titulo(DOCUMENTOS[i])}`));
arbol.slice(1, -1).forEach((nivel, n) => console.log(`Nivel ${n + 1}: ${nivel.map(corto).join('  ')}`));
console.log(`Raíz:    ${hex(raiz(hojas))}`);

// Probar que el documento 4 está en el árbol: bastan sus hermanos, uno por nivel.
const i = 4;
const hermanos = prueba(hojas, i);
console.log(`\nPrueba de pertenencia del documento ${i} (${titulo(DOCUMENTOS[i])}):`);
console.log(`  ${hermanos.length} hashes hermanos (log2(${hojas.length}) = ${Math.log2(hojas.length)}), ${hermanos.length * 32} bytes:`);
hermanos.forEach((h, n) => console.log(`  ${n + 1}. ${hex(h)}`));
const subida = recalcular(hojas[i], hermanos);
console.log(`Desde la hoja ${corto(hojas[i])}, con los ${hermanos.length} hermanos se llega a ${corto(subida)}`);
console.log(`¿Es la raíz? ${hex(subida) === hex(raiz(hojas)) ? 'sí: el documento está en el árbol' : 'no'}`);
console.log(`Con un millón de documentos (2^20) la prueba tendría ${Math.log2(2 ** 20)} hashes: ${20 * 32} bytes.`);

// Mutar una hoja: cambia la raíz, y la prueba vieja ya no lleva a ella.
const mutados = [...DOCUMENTOS];
mutados[1] = mutados[1].replace('nota 5.0', 'nota 7.0');
const raizNueva = raiz(mutados.map(hoja));
console.log(`\nSe cambia el documento 1: «${mutados[1]}»`);
console.log(`Raíz nueva: ${hex(raizNueva)}`);
console.log(`¿Cambió la raíz? ${hex(raizNueva) !== hex(raiz(hojas)) ? 'sí' : 'no'}`);
console.log(`La prueba vieja del documento ${i} lleva a ${corto(recalcular(hojas[i], hermanos))}, no a ${corto(raizNueva)}: ya no vale`);
console.log(`Prueba nueva del documento ${i}: ${prueba(mutados.map(hoja), i).map(corto).join('  ')}`);
console.log('\n✔ Una raíz de 32 bytes resume los 8 documentos; 3 hermanos prueban que uno está dentro.');
