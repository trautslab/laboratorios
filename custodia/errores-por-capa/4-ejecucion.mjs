// Paso 4 · Capa de ejecución: la transacción entra en un bloque, paga comisión y falla en el contrato.
import { createPublicClient, createWalletClient, decodeErrorResult, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { artefacto } from '../lib/compilar.mjs';

// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Nunca la uses en una red real.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const CAJA = '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35'; // donde la dejó 4-contrato.mjs
const { abi } = artefacto('errores-por-capa', 'Caja'); // la lista de funciones del contrato (laboratorio 19)

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte, pollingInterval: 100 });
const billetera = createWalletClient({ account: cuenta, chain: anvil, transport: transporte });
const retirar500 = { address: CAJA, abi, functionName: 'retirar', args: [500n] };

try {
  if (!(await cadena.getCode({ address: CAJA }))) {
    console.error('✖ Falta el contrato de prueba. Corre antes: node errores-por-capa/4-contrato.mjs');
    process.exit(1);
  }
  const saldoAntes = await cadena.getBalance({ address: cuenta.address });
  console.log('Envío:  retirar(500) a la Caja, que tiene un tope de 100.');
  // gas fijo: sin él, la librería simula antes de enviar y se niega a enviar algo que va a fallar.
  const hash = await billetera.writeContract({ ...retirar500, gas: 100000n });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  // El nodo envía status "0x0" o "0x1". viem lo traduce a 'reverted' o 'success'.
  const status = recibo.status === 'success' ? 1 : 0;
  console.log(`Hash:   sí, de ${(hash.length - 2) / 2} bytes. El nodo admitió la transacción.`);
  console.log(`Recibo: status ${status} · gas usado ${recibo.gasUsed}`);
  const saldoDespues = await cadena.getBalance({ address: cuenta.address });
  console.log(`Costo:  ${saldoDespues < saldoAntes ? 'el saldo de quien envía bajó: pagó comisión' : 'ninguno'}`);
  console.log(`Estado: retirado = ${await cadena.readContract({ address: CAJA, abi, functionName: 'retirado' })}. Lo que el contrato anotó se deshizo.`);

  // El recibo no trae el motivo. Una llamada simulada (eth_call) repite la ejecución sin enviar nada.
  console.log('\nLa misma llamada, simulada con eth_call:');
  try {
    await cadena.simulateContract({ ...retirar500, account: cuenta });
    console.log('  no falló');
  } catch (error) {
    const delNodo = error.walk(); // al fondo del error de viem está el objeto que envió el nodo
    console.log(`  code:    ${delNodo.code}\n  message: ${delNodo.message}`);
    console.log(`  data:    ${delNodo.data.slice(0, 10)} y ${(delNodo.data.length - 10) / 2} bytes más`);
    const motivo = decodeErrorResult({ abi, data: delNodo.data });
    console.log(`  motivo:  ${motivo.errorName}("${motivo.args[0]}")`);
  }
  console.log('\n✔ Capa de ejecución: hubo hash, recibo y comisión. El status 0 dice que falló; el motivo lo da la simulación.');
} catch (error) {
  console.error(`✖ No se pudo completar el paso: ${error.shortMessage ?? error.message}`);
  console.error('  Si no hay cadena en http://127.0.0.1:8545, abre otra terminal y corre: npx anvil');
  process.exit(1);
}
