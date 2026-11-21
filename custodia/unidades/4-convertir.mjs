// Paso 4 · Convertir en los bordes: de texto a entero al recibir, de entero a texto al mostrar.
import { formatEther, formatGwei, parseEther, parseGwei, parseUnits } from 'viem';

console.log('De texto a entero (al recibir un monto)');
console.log(`  "1.5" ETH                  → ${parseEther('1.5')} wei`);
console.log(`  "0.000000000000000001" ETH → ${parseEther('0.000000000000000001')} wei`);
console.log(`  "2.5" gwei                 → ${parseGwei('2.5')} wei`);
// parseEther y parseGwei son parseUnits con el exponente ya puesto: 18 y 9.
console.log(`  "2.5" con 9 decimales      → ${parseUnits('2.5', 9)} wei`);

const wei = 1234567890123456789n;
const propina = 2500000000n;
console.log('\nDe entero a texto (al mostrar un monto)');
console.log(`  ${wei} wei → ${formatEther(wei)} ETH`);
console.log(`  1 wei                   → ${formatEther(1n)} ETH`);
console.log(`  ${propina} wei          → ${formatEther(propina)} ETH`);
console.log(`  ${propina} wei          → ${formatGwei(propina)} gwei`);

// Ida y vuelta: el texto que sale vuelve a dar el mismo entero.
const vuelta = parseEther(formatEther(wei));
console.log(`\nIda y vuelta: ${wei} → "${formatEther(wei)}" → ${vuelta} (${vuelta === wei ? 'igual' : 'distinto'})`);
console.log('\n✔ Convertir es mover el punto decimal en un texto. No hay coma flotante en el camino.');
