// Paso 1 · Firmar un texto corto con una llave y mirar las tres partes de la firma.
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const mensaje = 'Recibí el pedido 42';

// Firmar es un cálculo local con la llave: no hay red, no hay transacción y no cuesta nada.
const firma = await cuenta.signMessage({ message: mensaje });
const bytes = new TextEncoder().encode(mensaje).length;
console.log(`Mensaje:  «${mensaje}» (${mensaje.length} caracteres, ${bytes} bytes)`);
console.log(`Firmante: ${cuenta.address}`);
console.log(`\nFirma (${(firma.length - 2) / 2} bytes):`);
console.log(firma);

// La firma son tres valores pegados: r (32 bytes), s (32 bytes) y v (1 byte).
console.log(`  r: 0x${firma.slice(2, 66)}`);
console.log(`  s: 0x${firma.slice(66, 130)}`);
console.log(`  v: 0x${firma.slice(130)} (${parseInt(firma.slice(130), 16)})`);

// Con la misma llave y el mismo mensaje, la firma sale igual cada vez.
const otraVez = await cuenta.signMessage({ message: mensaje });
console.log(`\nFirmar otra vez el mismo mensaje da la misma firma: ${otraVez === firma ? 'sí' : 'no'}`);
console.log('\n✔ La firma son 65 bytes: r, s y v. Este script no habló con ninguna red.');
