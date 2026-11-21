// Paso 5 · Los bloques: esta cadena solo avanza cuando pasa algo, y vive en memoria.
import { createPublicClient, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
// cacheTime 0: viem recuerda el último bloque unos segundos; aquí queremos el dato fresco.
const bloqueActual = () => cadena.getBlockNumber({ cacheTime: 0 });

try {
  console.log(`Bloque ahora:               ${await bloqueActual()}`);
  await new Promise((listo) => setTimeout(listo, 3000));
  console.log(`Tres segundos después:      ${await bloqueActual()}`);

  // anvil_mine es un método propio de Anvil: produce bloques a pedido. No existe en una red real.
  await cadena.request({ method: 'anvil_mine', params: ['0x1'] });
  console.log(`Después de pedir un bloque: ${await bloqueActual()}`);
  console.log('\n✔ Sin transacciones no hay bloques nuevos. Y todo esto vive en la memoria de Anvil.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
