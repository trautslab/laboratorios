// Paso 5 · El mismo retiro con MPC: dos partes firman juntas y sale UNA firma normal.
import { keccak256, parseEther, parseGwei, serializeTransaction } from 'viem';
import { anvil } from 'viem/chains';
import { ANA, cadena, corto, dato, exigir, exigirCadena, guardar, leer, listo, nota, saldoEnEth, terminar, titulo } from './lib/comun.mjs';
import { deTexto, firmarEntre } from './lib/mpc.mjs';

try {
  await exigirCadena();
  const mpc = exigir(leer('mpc.json'), 'Falta la llave MPC. Corre antes: node 04-generar-llave-mpc.mjs');
  const antes = await saldoEnEth(ANA);

  // Una transferencia común, igual que en el laboratorio del mini custodio.
  const tx = {
    type: 'eip1559',
    chainId: anvil.id,
    nonce: await cadena.getTransactionCount({ address: mpc.address }),
    to: ANA,
    value: parseEther('1'),
    gas: 21_000n,
    maxFeePerGas: parseGwei('2'),
    maxPriorityFeePerGas: parseGwei('1'),
  };
  const hash = keccak256(serializeTransaction(tx));

  // Carla y Elena firman juntas. Diego no participa: con dos alcanza.
  const { firma, mensajes } = await firmarEntre([deTexto(mpc.partes.Carla), deTexto(mpc.partes.Elena)], hash, mpc.address);
  const recibo = await cadena.waitForTransactionReceipt({ hash: await cadena.sendRawTransaction({ serializedTransaction: serializeTransaction(tx, firma) }) });
  guardar('retiros.json', { ...(leer('retiros.json') ?? {}), mpc: recibo.transactionHash });

  titulo('Retiro de 1 ETH a Ana con MPC');
  dato('Quiénes firmaron', 'Carla y Elena (2 de 3)');
  dato('Mensajes intercambiados', `${mensajes}, en 4 rondas`);
  dato('Firma resultante', `una sola: r ${corto(firma.r, 10, 6)} s ${corto(firma.s, 10, 6)}`);
  titulo('Recibo');
  dato('Estado', recibo.status);
  dato('Destino de la transacción', `${recibo.to} (Ana, directo)`);
  dato('Gas usado', recibo.gasUsed);
  dato('Ana antes / después', `${antes} / ${await saldoEnEth(ANA)} ETH`);
  nota('Para la cadena es una transferencia cualquiera, firmada por una cuenta cualquiera.');
  listo('Dos partes firmaron y la cadena vio una sola firma.');
} catch (error) {
  terminar(error);
}
