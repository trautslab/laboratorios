// Paso 2 · Qué produce el compilador: la interfaz (ABI) y los bytes que se suben a la cadena.
import { readFileSync } from 'node:fs';
import { keccak256, size, toBytes, toFunctionSignature } from 'viem';

const artefacto = JSON.parse(readFileSync(new URL('./contratos/out/Contador.json', import.meta.url), 'utf8'));

console.log(`Compilador: solc ${artefacto.solc}`);
console.log(`Código de creación: ${size(artefacto.bytecode.object)} bytes (se envía una vez, al desplegar)`);
console.log(`Código que queda:   ${size(artefacto.deployedBytecode.object)} bytes (lo que guarda la cadena)\n`);

// Cada función se llama por un selector: los 4 primeros bytes del keccak256 de su firma.
console.log('Funciones del ABI:');
for (const entrada of artefacto.abi.filter((e) => e.type === 'function')) {
  const firma = toFunctionSignature(entrada);
  const selector = keccak256(toBytes(firma)).slice(0, 10);
  const tipo = entrada.stateMutability === 'view' ? 'lee' : 'escribe';
  console.log(`  ${firma.padEnd(16)} selector ${selector}  ${tipo}`);
}
console.log('\n✔ El ABI dice cómo hablarle al contrato; el código es lo que la cadena ejecuta.');
