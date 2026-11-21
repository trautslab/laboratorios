// Paso 5 · Los decimales son de cada activo: el mismo "1.5" da enteros distintos.
import { formatUnits, parseUnits } from 'viem';

const ETH = 18; // decimales de ETH
const DOLAR = 6; // decimales de la stablecoin de dólar de este ejemplo

const enEth = parseUnits('1.5', ETH);
const enDolar = parseUnits('1.5', DOLAR);
console.log('El mismo texto, dos activos');
console.log(`  "1.5" con 18 decimales → ${enEth}`);
console.log(`  "1.5" con  6 decimales → ${enDolar}`);
console.log(`  Un entero es ${enEth / enDolar} veces el otro (10^12)`);

console.log('\nEl mismo entero, leído con los decimales de otro activo');
console.log(`  ${enDolar} con  6 decimales → ${formatUnits(enDolar, DOLAR)} (correcto)`);
console.log(`  ${enDolar} con 18 decimales → ${formatUnits(enDolar, ETH)}`);
console.log(`  ${enEth} con 18 decimales → ${formatUnits(enEth, ETH)} (correcto)`);
console.log(`  ${enEth} con  6 decimales → ${formatUnits(enEth, DOLAR)}`);

console.log('\n✔ El entero no dice cuántos decimales tiene. Ese dato va siempre junto al monto.');
