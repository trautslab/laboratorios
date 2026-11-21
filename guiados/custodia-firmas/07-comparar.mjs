// Paso 7 · Las dos transacciones, lado a lado, tal como las ve cualquiera en la cadena.
import { decodeFunctionData, hashMessage, recoverAddress } from 'viem';
import { cadena, dato, exigir, exigirCadena, leer, listo, nombreDe, nota, terminar, titulo } from './lib/comun.mjs';
import { multifirma } from './lib/multifirma.mjs';

try {
  await exigirCadena();
  const retiros = exigir(leer('retiros.json'), 'Faltan los retiros. Corre antes los pasos 2 y 5.');
  const { address, abi } = multifirma();
  const ver = async (hash) => ({ tx: await cadena.getTransaction({ hash }), recibo: await cadena.getTransactionReceipt({ hash }) });
  const a = await ver(retiros.multifirma);
  const b = await ver(retiros.mpc);

  // De la transacción de la multifirma se pueden sacar las firmas y saber quién firmó.
  const { args } = decodeFunctionData({ abi, data: a.tx.input });
  const huella = await cadena.readContract({ address, abi, functionName: 'huella', args: [args[0], args[1], args[2], 0n] });
  const firmantes = await Promise.all(args[3].map(async (firma) => nombreDe(await recoverAddress({ hash: hashMessage({ raw: huella }), signature: firma }))));

  const fila = (etiqueta, x, y) => console.log(`${etiqueta.padEnd(30)} ${String(x).padEnd(34)} ${y}`);
  titulo('El mismo retiro de 1 ETH a Ana');
  fila('', 'MULTIFIRMA', 'MPC');
  fila('La transacción va a', 'un contrato', 'Ana, directo');
  fila('Datos adjuntos', `${(a.tx.input.length - 2) / 2} bytes`, `${(b.tx.input.length - 2) / 2} bytes`);
  fila('Gas usado', a.recibo.gasUsed, b.recibo.gasUsed);
  fila('Firmas visibles en la cadena', `${args[3].length} (${firmantes.join(' y ')})`, '1 (no dice de quién)');
  fila('Umbral visible en la cadena', `sí: ${await cadena.readContract({ address, abi, functionName: 'umbral' })} de 3`, 'no');
  fila('Quién hace cumplir la regla', 'el contrato, en la cadena', 'el protocolo, fuera de la cadena');
  const veces = Number((a.recibo.gasUsed * 100n) / b.recibo.gasUsed) / 100;
  nota(`La multifirma costó ${veces} veces el gas de la transferencia con MPC.`);
  nota('Con la multifirma, un tercero puede auditar quién firmó. Con MPC, eso depende de tus propios registros.');
  listo('Mismo resultado para Ana; rastro muy distinto en la cadena.');
} catch (error) {
  terminar(error);
}
