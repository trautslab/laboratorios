// Paso 4 · Lo que se firmó de verdad: el hash del mensaje con un prefijo delante.
import { keccak_256 } from '@noble/hashes/sha3.js';
import { hashMessage, recoverAddress, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const mensaje = 'Recibí el pedido 42';
const firmaDelPaso1 = await cuenta.signMessage({ message: mensaje });

// El prefijo a mano: el byte 0x19, un texto fijo y la longitud del mensaje en bytes, escrita en decimal.
const texto = new TextEncoder().encode(mensaje);
const prefijo = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${texto.length}`);
const todo = new Uint8Array([...prefijo, ...texto]);
console.log(`Prefijo (${prefijo.length} bytes): ${toHex(prefijo)}`);
console.log(`Mensaje (${texto.length} bytes): ${toHex(texto)}`);

// Lo que entra a la firma es el hash Keccak-256 de esos bytes juntos: 32 bytes.
const hash = toHex(keccak_256(todo));
console.log(`\nHash hecho a mano:       ${hash}`);
console.log(`Hash que da la librería: ${hashMessage(mensaje)}`);

// Firmar ese hash directamente, sin que la librería añada nada, da la firma del paso 1.
const firma = await cuenta.sign({ hash });
console.log(`\nFirma de ese hash: ${firma}`);
console.log(`Es la firma del paso 1: ${firma === firmaDelPaso1 ? 'sí' : 'no'}`);
console.log(`Dirección recuperada con el hash:     ${await recoverAddress({ hash, signature: firma })}`);

// Quien verifica tiene que armar el mismo hash. Si olvida el prefijo, recupera otra dirección.
const sinPrefijo = toHex(keccak_256(texto));
console.log(`Dirección recuperada sin el prefijo:  ${await recoverAddress({ hash: sinPrefijo, signature: firma })}`);
console.log('\n✔ «Firmar un mensaje» es firmar keccak256(prefijo + mensaje). El prefijo empieza por 0x19.');
