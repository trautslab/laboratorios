// Paso 5 · Un programa que solo conoce la llave pública extendida y lista direcciones para recibir.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { HARDENED_OFFSET, HDKey } from '@scure/bip32';
import { publicKeyToAddress } from 'viem/accounts';

// Lo único que este programa conoce: el texto que exportó 5-exportar-xpub.mjs. Aquí no hay frase.
const XPUB = 'xpub6Ce9NcJvTk36xtLSrJLZqE7wtgA5deCeYs7rSQtreh4cj6ByPtrg9sD7V2FNFLPnf8heNP3FGkeV9qwfzvZNSd54JoNXVsXFYSYwHsnJxqP';
const cuenta = HDKey.fromExtendedKey(XPUB); // revisa la comprobación del texto y lee sus campos

// La dirección sale de la llave pública sin comprimir (los 64 bytes del punto).
const direccion = (hija) => publicKeyToAddress(`0x${bytesToHex(secp256k1.Point.fromBytes(hija.publicKey).toBytes(false))}`);

console.log(`Entrada: ${XPUB.slice(0, 12)}…${XPUB.slice(-6)} (nivel ${cuenta.depth} del árbol, m/44'/60'/0')`);
console.log(`  llave pública    0x${bytesToHex(cuenta.publicKey)}`);
console.log(`  código de cadena 0x${bytesToHex(cuenta.chainCode)}\n`);

// Dos pasos sin apóstrofo: «/0» (direcciones para recibir) y el índice. Solo usan datos públicos.
const recibir = cuenta.deriveChild(0);
for (const i of [0, 1, 2]) console.log(`m/44'/60'/0'/0/${i} → ${direccion(recibir.deriveChild(i))}`);

// Un paso con apóstrofo necesita la llave privada del padre, y aquí no está.
try {
  cuenta.deriveChild(HARDENED_OFFSET + 0);
  console.log("\nHija con apóstrofo (0'): calculada");
} catch {
  console.log("\nHija con apóstrofo (0'): no se puede calcular sin la llave privada del padre");
}
console.log('\n✔ Con la llave pública extendida salen las direcciones, pero ninguna llave para firmar.');
