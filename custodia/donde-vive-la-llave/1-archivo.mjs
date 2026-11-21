// Paso 1 · Un archivo en claro: quien puede leer el archivo tiene la llave.
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { keccak256, serializeSignature, toHex } from 'viem';
import { privateKeyToAddress, sign } from 'viem/accounts';

// Llave de prueba n.º 0 de Anvil. Es PÚBLICA: sirve para practicar y para nada más.
const LLAVE_DE_PRUEBA = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// Lo que se firma en todo el laboratorio: siempre estos 32 bytes.
const HASH = keccak256(toHex('Orden de retiro 42: 1 ETH para Ana'));
const TMP = new URL('./tmp/', import.meta.url);
const ARCHIVO = new URL('llave.txt', TMP);
const RESPALDO = new URL('respaldo/llave.txt', TMP);

// Lee la llave de un archivo y firma el hash con ella.
async function firmarCon(archivo) {
  const privateKey = readFileSync(archivo, 'utf8').trim();
  const firma = await sign({ hash: HASH, privateKey });
  return { direccion: privateKeyToAddress(privateKey), firma: serializeSignature(firma) };
}

// Guardar: la llave queda escrita tal cual. Permisos 600: solo el dueño del archivo lo lee.
mkdirSync(new URL('respaldo/', TMP), { recursive: true });
writeFileSync(ARCHIVO, `${LLAVE_DE_PRUEBA}\n`, { mode: 0o600 });
const { size, mode } = statSync(ARCHIVO);
console.log('Lugar 1 · un archivo en claro');
console.log(`  Archivo:   donde-vive-la-llave/tmp/llave.txt (${size} bytes, permisos ${(mode & 0o777).toString(8)})`);
console.log(`  Contenido: ${readFileSync(ARCHIVO, 'utf8').trim()}`);

const original = await firmarCon(ARCHIVO);
console.log('\nFirmar con la llave del archivo');
console.log(`  Hash:      ${HASH}`);
console.log(`  Dirección: ${original.direccion}`);
console.log(`  Firma:     ${original.firma}`);

console.log('\nDónde está la llave');
console.log('  En el disco: en claro, antes y después de firmar.');
console.log('  En la memoria del programa: desde que lee el archivo.');

// Un respaldo, una copia a otra máquina o un `cat` de otro programa: todos copian la llave.
copyFileSync(ARCHIVO, RESPALDO);
const copia = await firmarCon(RESPALDO);
console.log('\nQuien lee el archivo obtiene la llave completa');
console.log('  Copia de respaldo: donde-vive-la-llave/tmp/respaldo/llave.txt');
console.log(`  Firma hecha solo con la copia: ${copia.firma === original.firma ? 'idéntica a la de arriba' : 'DISTINTA'}`);
console.log('✔ Archivo en claro: leerlo es tener la llave. La copia firma igual que el original.');
