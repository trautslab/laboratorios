// Paso 2 · El estado antes: cuánto tiene quien envía y cuánto quien recibe.
import { createPublicClient, formatEther, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

const ORIGEN = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // cuenta de prueba 0 de Anvil
const DESTINO = '0x40596E1B9B0032595240d85AC2Cf9e6b83041399'; // una dirección que nadie usó en esta cadena

try {
  console.log(`Bloque actual: ${await cadena.getBlockNumber()}`);
  const origen = await cadena.getBalance({ address: ORIGEN }); // por dentro: eth_getBalance
  const destino = await cadena.getBalance({ address: DESTINO });
  console.log(`Quien envía  (${ORIGEN}): ${formatEther(origen)} ETH`);
  console.log(`Quien recibe (${DESTINO}): ${formatEther(destino)} ETH`);
  console.log('\n✔ Este es el estado de la cadena antes de la transferencia.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
