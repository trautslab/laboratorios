// Paso 2 · Una variable de entorno: fuera del repositorio, a la vista de los procesos de tu usuario.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { keccak256, serializeSignature, toHex } from 'viem';
import { privateKeyToAddress, sign } from 'viem/accounts';

const HASH = keccak256(toHex('Orden de retiro 42: 1 ETH para Ana')); // los mismos 32 bytes del paso 1
// Llave de prueba n.º 0 de Anvil. Es PÚBLICA: por eso puede ir escrita en un comando.
const LLAVE_DE_PRUEBA = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const privateKey = process.env.LLAVE_PRIVADA;
if (!/^0x[0-9a-f]{64}$/.test(privateKey ?? '')) {
  console.error(`✖ Falta la variable LLAVE_PRIVADA. Corre: LLAVE_PRIVADA=${LLAVE_DE_PRUEBA} node donde-vive-la-llave/2-variable.mjs`);
  process.exit(1);
}
console.log('Lugar 2 · una variable de entorno');
console.log(`  LLAVE_PRIVADA: ${privateKey.length} caracteres. El programa no abrió ningún archivo.`);

const firma = await sign({ hash: HASH, privateKey });
console.log('\nFirmar con la llave de la variable');
console.log(`  Hash:      ${HASH}`);
console.log(`  Dirección: ${privateKeyToAddress(privateKey)}`);
console.log(`  Firma:     ${serializeSignature(firma)}`);

console.log('\nDónde está la llave');
console.log('  En el disco: en ningún archivo de este laboratorio.');
console.log('  En la memoria del programa: desde que arranca, con el resto de su entorno.');

// Un proceso hijo recibe una copia del entorno aunque no le pases nada.
const hijo = execFileSync('/bin/sh', ['-c', 'printf %s "$LLAVE_PRIVADA"']).toString();
// Otro proceso, con su propio entorno vacío, lee el de este en /proc (solo Linux).
const propio = `/proc/${process.pid}/environ`;
const ajeno = existsSync(propio) ? execFileSync('/bin/cat', [propio], { env: {} }).toString().split('\0') : [];
const vista = ajeno.find((linea) => linea.startsWith('LLAVE_PRIVADA='))?.slice('LLAVE_PRIVADA='.length);
console.log('\nQuién más puede leerla');
console.log(`  Un proceso hijo, sin pasarle nada: ${hijo === privateKey ? 'la heredó completa' : 'no la tiene'}`);
console.log(`  Otro proceso de tu usuario, en /proc/<pid>/environ: ${vista === privateKey ? 'la leyó completa' : 'no la encontró (este sistema no tiene /proc)'}`);
console.log('✔ Variable de entorno: no está en el repositorio, pero la ven tus procesos hijos y quien lea tu entorno.');
