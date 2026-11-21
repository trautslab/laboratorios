// Paso 5 · Escribir: una transacción con destino el contrato y los datos de la llamada.
import { createPublicClient, createWalletClient, http, pad, toHex } from 'viem';
import { anvil } from 'viem/chains';
import { artefacto } from '../lib/compilar.mjs';

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const QUIEN = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const CONTADOR = '0x8464135c8F25Da09e49BC8782676a84730C318bC';
const { abi } = artefacto('contrato-minimo', 'Contador');

try {
  const casilla0 = async () => cadena.getStorageAt({ address: CONTADOR, slot: pad(toHex(0)) }); // eth_getStorageAt
  console.log(`Casilla 0 antes:   ${await casilla0()}`);

  const cuenta = createWalletClient({ account: QUIEN, chain: anvil, transport: transporte });
  const hash = await cuenta.writeContract({ address: CONTADOR, abi, functionName: 'sumar', args: [5n], gas: 100000n, maxFeePerGas: 2000000000n, maxPriorityFeePerGas: 1000000000n });
  const tx = await cadena.getTransaction({ hash });
  console.log(`Datos enviados:    ${tx.input.slice(0, 10)} + ${tx.input.slice(10)}`);
  console.log(`                   selector de sumar(uint256) + el 5 en 32 bytes`);

  const recibo = await cadena.waitForTransactionReceipt({ hash });
  console.log(`Recibo: status ${recibo.status === 'success' ? 1 : 0} · bloque ${recibo.blockNumber} · gas usado ${recibo.gasUsed}`);
  console.log(`Casilla 0 después: ${await casilla0()}`);
  console.log(`valor() ahora:     ${await cadena.readContract({ address: CONTADOR, abi, functionName: 'valor' })}`);
  console.log('\n✔ Escribir cambia el estado del contrato: hace falta una transacción, un bloque y una comisión.');
} catch {
  console.error('✖ No hay contrato en esa dirección. Corre antes el paso 3 sobre una cadena nueva.');
  process.exit(1);
}
