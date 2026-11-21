// Paso 4 · El checksum EIP-55: las mayúsculas de una dirección sirven para detectar un error de copia.
import { keccak_256 } from '@noble/hashes/sha3.js';
import { isAddress } from 'viem';

// La dirección del paso 3, en minúsculas y sin 0x.
const DIRECCION = 'f39fd6e51aad88f6f4ce6ab8827279cfffb92266';

// El hash se calcula sobre el TEXTO de la dirección (40 caracteres en minúsculas), no sobre sus 20 bytes.
const hashDe = (minusculas) => Buffer.from(keccak_256(Buffer.from(minusculas, 'ascii'))).toString('hex').slice(0, 40);
// La regla: cada letra va en mayúscula si el dígito del hash en su misma posición es 8 o más.
function conChecksum(direccion) {
  const minusculas = direccion.toLowerCase();
  const hash = hashDe(minusculas);
  return [...minusculas].map((letra, i) => (parseInt(hash[i], 16) >= 8 ? letra.toUpperCase() : letra)).join('');
}

const resultado = conChecksum(DIRECCION);
console.log('Cada carácter de la dirección, sobre el dígito del hash en su misma posición:');
console.log(`  dirección: ${DIRECCION}`);
console.log(`  hash:      ${hashDe(DIRECCION)}`);
console.log(`  resultado: ${resultado}`);
console.log(`Con checksum: 0x${resultado}`);
console.log(`Letras (a-f): ${[...DIRECCION].filter((c) => c >= 'a').length}. En mayúscula quedaron ${[...resultado].filter((c) => c >= 'A' && c <= 'F').length}.`);

// Alguien copia mal el último carácter: un 6 se vuelve 7.
const malCopiada = `${resultado.slice(0, 39)}7`;
console.log('\nUn error de copia en el último carácter (6 → 7):');
console.log(`  texto recibido:            0x${malCopiada}`);
console.log(`  checksum de esa dirección: 0x${conChecksum(malCopiada)}`);
console.log(`  A mano: ${conChecksum(malCopiada) === malCopiada ? 'coinciden' : 'no coinciden, el texto está mal copiado'}`);
console.log(`  La librería: ${isAddress(`0x${malCopiada}`) ? 'la acepta' : 'la rechaza'}`);

// El mismo error en un texto todo en minúsculas: no hay mayúsculas que comparar.
const enMinusculas = malCopiada.toLowerCase();
console.log('\nEl mismo error, con todo en minúsculas:');
console.log(`  texto recibido: 0x${enMinusculas}`);
console.log(`  La librería: ${isAddress(`0x${enMinusculas}`) ? 'la acepta' : 'la rechaza'}`);
console.log('\n✔ El checksum va en las mayúsculas: delata un carácter mal copiado. Una dirección en minúsculas no lleva ninguno.');
