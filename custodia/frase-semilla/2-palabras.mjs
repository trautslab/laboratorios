// Paso 2 · La frase es un número escrito con palabras. De ella sale la semilla.
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { mnemonicToEntropy, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE = 'test test test test test test test test test test test junk';
const once = FRASE.split(' ').slice(0, 11).join(' ');
const bits = (numero, ancho) => numero.toString(2).padStart(ancho, '0');

console.log(`Frase: ${FRASE}\n`);
console.log('Cada palabra es su posición en una lista fija de 2048 palabras: 11 bits.');
for (const palabra of ['test', 'junk']) console.log(`  ${palabra} → ${wordlist.indexOf(palabra)} = ${bits(wordlist.indexOf(palabra), 11)}`);

// 12 palabras × 11 bits = 132 bits: 128 son el número y los 4 últimos lo comprueban.
const numero = mnemonicToEntropy(FRASE, wordlist); // lanza un error si la comprobación no coincide
console.log(`\nEl número, 128 bits: 0x${bytesToHex(numero)}`);
console.log(`Comprobación, 4 bits: ${bits(wordlist.indexOf('junk') & 0b1111, 4)} al final de «junk»`);
console.log(`Debe ser el principio de SHA-256(número): ${bits(sha256(numero)[0] >> 4, 4)}`);

// Cambiar la última palabra por otra de la lista casi siempre rompe la comprobación.
console.log('\nLas 11 primeras palabras iguales y otra al final:');
for (const ultima of ['junk', 'just', 'absent']) {
  const valida = validateMnemonic(`${once} ${ultima}`, wordlist);
  console.log(`  … test ${ultima.padEnd(6)} → ${valida ? 'válida' : 'rechazada: la comprobación no coincide'}`);
}
const validas = wordlist.filter((ultima) => validateMnemonic(`${once} ${ultima}`, wordlist));
console.log(`  De las 2048 palabras posibles al final, ${validas.length} dan una frase válida.`);

// La semilla sale del texto de la frase: PBKDF2 con HMAC-SHA512, 2048 vueltas, 64 bytes.
const semilla = mnemonicToSeedSync(FRASE);
console.log(`\nSemilla, ${semilla.length} bytes:\n  0x${bytesToHex(semilla.slice(0, 32))}\n    ${bytesToHex(semilla.slice(32))}`);
console.log('\n✔ 12 palabras son 128 bits más 4 de comprobación, y de la frase sale una semilla de 64 bytes.');
