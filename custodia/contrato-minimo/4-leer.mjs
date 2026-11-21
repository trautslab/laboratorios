// Paso 4 · Leer: eth_call ejecuta la función en el nodo, sin transacción y sin pagar.
import { createPublicClient, decodeFunctionResult, encodeFunctionData, http } from 'viem';
import { anvil } from 'viem/chains';
import { artefacto } from '../lib/compilar.mjs';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const CONTADOR = '0x8464135c8F25Da09e49BC8782676a84730C318bC'; // donde quedó en el paso 3
const { abi } = artefacto('contrato-minimo', 'Contador');

try {
  const antes = await cadena.getBlockNumber({ cacheTime: 0 });
  const datos = encodeFunctionData({ abi, functionName: 'valor' });
  console.log(`Datos de la llamada: ${datos} (4 bytes: solo el selector)`);

  const { data } = await cadena.call({ to: CONTADOR, data: datos }); // por dentro: eth_call
  console.log(`Respuesta cruda: ${data}`);
  console.log(`Decodificada: valor = ${decodeFunctionResult({ abi, functionName: 'valor', data })}`);

  const despues = await cadena.getBlockNumber({ cacheTime: 0 });
  console.log(`Bloque antes: ${antes} · bloque después: ${despues}`);
  console.log('\n✔ Leer no crea transacción: no hay hash, ni bloque nuevo, ni comisión.');
} catch {
  console.error('✖ No hay contrato en esa dirección. Corre antes el paso 3 sobre una cadena nueva.');
  process.exit(1);
}
