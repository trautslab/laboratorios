// Paso 3 · Qué le pasa a un monto en wei dentro de un Number, y qué pasa dentro de un BigInt.
const monto = 1234567890123456789n; // 1.234567890123456789 ETH, en wei

console.log('Con coma flotante de 64 bits (Number en JavaScript, f64 en Rust)');
console.log(`  Entero seguro más grande: ${Number.MAX_SAFE_INTEGER} (2^53 - 1)`);
console.log(`  2^53 + 1                = ${2 ** 53 + 1}`);
// Number(monto) busca el valor de 64 bits más cercano. BigInt(...) lo muestra sin redondear al imprimir.
const ida = BigInt(Number(monto));
console.log(`  ${monto} wei → ${ida} wei (cambió ${monto - ida} wei)`);
// El error clásico: pasar ETH a wei multiplicando por 1e18.
const mal = BigInt(Number('1.1') * 1e18);
console.log(`  "1.1" ETH × 10^18       = ${mal} wei (sobran ${mal - 11n * 10n ** 17n} wei)`);
console.log(`  0.1 + 0.2               = ${0.1 + 0.2}`);

console.log('\nCon enteros (BigInt en JavaScript, U256 en Rust)');
console.log(`  2^53 + 1                = ${2n ** 53n + 1n}`);
const vuelta = BigInt(monto.toString()); // a texto y de vuelta: así se guarda y se envía
console.log(`  ${monto} wei → ${vuelta} wei (cambió ${monto - vuelta} wei)`);
console.log(`  1.1 ETH = 11 × 10^17    = ${11n * 10n ** 17n} wei`);
const decima = 10n ** 17n; // 0.1 ETH en wei
console.log(`  0.1 ETH + 0.2 ETH       = ${decima + 2n * decima} wei`);

console.log('\n✔ Un monto en wei no cabe en un Number. Como entero, no se pierde ni un wei.');
