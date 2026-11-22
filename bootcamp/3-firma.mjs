// Paso 3 · Llave privada, llave pública, dirección y firma de una huella con secp256k1.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { getAddress } from 'viem';
import { DOCUMENTOS, hex, huella } from './lib/comun.mjs';

// En la práctica la llave privada sale del azar del sistema: 32 bytes. Esta línea cambia en cada corrida.
console.log(`≈ Una llave privada nueva, al azar: ${hex(secp256k1.utils.randomSecretKey())}`);

// Para que la salida se repita, el laboratorio fija una: 32 bytes sacados al azar una vez. No la uses para nada real.
const privada = hexToBytes('9db24b5a373d497d9f5ac62746e3b19d0cca8af007350a80512f9e5341a19127');
const n = secp256k1.Point.CURVE().n; // cuántos puntos tiene el grupo: la llave debe estar entre 1 y n - 1
console.log(`Llave privada fija (32 bytes): ${hex(privada)}`);
console.log(`  ¿Está entre 1 y n - 1? ${BigInt(hex(privada)) > 0n && BigInt(hex(privada)) < n ? 'sí' : 'no'}  (n = ${n})`);

// Pública = privada × G: sumar el punto G de la curva consigo mismo «privada» veces. Volver de la pública a la privada es el problema del logaritmo discreto.
const publica = secp256k1.getPublicKey(privada, false); // 65 bytes: 04 + x + y
console.log('\nLlave pública = privada × G, un punto (x, y) de secp256k1:');
console.log(`  x: ${hex(publica.slice(1, 33))}`);
console.log(`  y: ${hex(publica.slice(33))}`);
console.log(`  comprimida (33 bytes): ${hex(secp256k1.getPublicKey(privada, true))}`);
// Últimos 20 bytes de keccak256(x ‖ y). getAddress solo agrega mayúsculas de control (EIP-55).
const direccion = (pub) => getAddress(hex(keccak_256(pub.slice(1)).slice(12)));
console.log(`Dirección (últimos 20 bytes de keccak256(x ‖ y)): ${direccion(publica)}`);

// Se firma la huella del documento, no el documento: 32 bytes. La firma es determinista (RFC 6979).
const documento = DOCUMENTOS[4];
const h = huella(documento);
const firma = secp256k1.Signature.fromBytes(secp256k1.sign(h, privada, { prehash: false, format: 'recovered' }), 'recovered');
console.log(`\nDocumento: «${documento}»`);
console.log(`Huella que se firma: ${hex(h)}`);
console.log(`  r: 0x${firma.r.toString(16).padStart(64, '0')}`);
console.log(`  s: 0x${firma.s.toString(16).padStart(64, '0')}`);
console.log(`  v: ${27 + firma.recovery} (recovery ${firma.recovery}: dice cuál de los puntos candidatos es la llave)`);

// Con la huella y la firma se recupera la llave pública, y de ella la dirección. Así verifica Ethereum (ecrecover).
const recuperada = direccion(firma.recoverPublicKey(h).toBytes(false));
console.log(`\nDirección recuperada de (huella, r, s, v): ${recuperada}`);
console.log(`¿Es la del firmante? ${recuperada === direccion(publica) ? 'sí' : 'no'}`);
console.log(`Verificación con la llave pública: ${secp256k1.verify(firma.toBytes('compact'), h, publica, { prehash: false }) ? 'válida' : 'NO válida'}`);

// Un byte cambiado en el mensaje: otra huella, y la misma firma ya no corresponde.
const alterado = documento.replace('6.9', '7.9');
const h2 = huella(alterado);
console.log(`\nMensaje alterado: «${alterado}»`);
console.log(`Huella: ${hex(h2)}`);
console.log(`Verificación de la misma firma: ${secp256k1.verify(firma.toBytes('compact'), h2, publica, { prehash: false }) ? 'válida' : 'NO válida'}`);
console.log(`Dirección recuperada: ${direccion(firma.recoverPublicKey(h2).toBytes(false))} (otra cuenta)`);
console.log('\n✔ La llave privada firma la huella; con la firma cualquiera recupera la dirección y detecta un cambio.');
