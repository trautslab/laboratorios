// Paso 3 · Desplegar: una transacción sin destino que lleva el código de creación.
import { createPublicClient, createWalletClient, getAddress, getContractAddress, http, size } from 'viem';
import { anvil } from 'viem/chains';
import { artefacto } from '../lib/compilar.mjs';

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const QUIEN = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // la cuenta de prueba 1 de Anvil
const { abi, bytecode } = artefacto('contrato-minimo', 'Contador');

try {
  // La dirección se puede saber antes de enviar: sale de quien despliega y de su nonce.
  const nonce = await cadena.getTransactionCount({ address: QUIEN });
  const prevista = getContractAddress({ from: QUIEN, nonce: BigInt(nonce) });
  console.log(`Quien despliega: ${QUIEN} (nonce ${nonce})`);
  console.log(`Dirección prevista: ${prevista}\n`);

  const cuenta = createWalletClient({ account: QUIEN, chain: anvil, transport: transporte });
  const hash = await cuenta.deployContract({ abi, bytecode, gas: 200000n, maxFeePerGas: 2000000000n, maxPriorityFeePerGas: 1000000000n });
  const tx = await cadena.getTransaction({ hash });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  console.log(`Transacción: to = ${tx.to ?? 'null'} · datos = ${size(tx.input)} bytes`);
  console.log(`Recibo: status ${recibo.status === 'success' ? 1 : 0} · bloque ${recibo.blockNumber} · gas usado ${recibo.gasUsed}`);
  console.log(`Dirección del recibo: ${getAddress(recibo.contractAddress)}`);
  console.log(`¿Coincide con la prevista? ${recibo.contractAddress.toLowerCase() === prevista.toLowerCase() ? 'sí' : 'no'}`);
  console.log(`Código guardado: ${size(await cadena.getCode({ address: prevista }))} bytes`);
  console.log('\n✔ El contrato existe: una dirección nueva con código, creada por una transacción.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
