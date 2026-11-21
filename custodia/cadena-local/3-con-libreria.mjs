// Paso 3 · La misma pregunta con una librería: viem arma el JSON y convierte la respuesta.
import { createPublicClient, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

try {
  const chainId = await cadena.getChainId(); // por dentro: eth_chainId
  const bloque = await cadena.getBlockNumber(); // por dentro: eth_blockNumber
  console.log(`Chain id:      ${chainId}`);
  console.log(`Bloque actual: ${bloque}`);
  console.log('\n✔ Mismas respuestas que a mano, ya convertidas a números.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
