// El libro interno: cuánto le debe el custodio a cada cliente.
// La cadena dice cuánto hay en cada dirección; el libro dice de quién es.
import { formatEther, parseEther } from 'viem';
import { guardar, leer } from './estado.mjs';

const ARCHIVO = 'libro.json';

export function leerLibro() {
  return leer(ARCHIVO, { saldos: {}, movimientos: [] });
}

function anotar(cliente, deltaWei, concepto) {
  const libro = leerLibro();
  const actual = BigInt(libro.saldos[cliente] ?? '0');
  if (actual + deltaWei < 0n) throw new Error(`${cliente} no tiene saldo suficiente en el libro.`);
  libro.saldos[cliente] = (actual + deltaWei).toString();
  libro.movimientos.push({ cliente, wei: deltaWei.toString(), concepto });
  guardar(ARCHIVO, libro);
}

export const acreditar = (cliente, montoEth, concepto) => anotar(cliente, parseEther(montoEth), concepto);
export const debitar = (cliente, montoEth, concepto) => anotar(cliente, -parseEther(montoEth), concepto);
export const saldoCliente = (cliente) => formatEther(BigInt(leerLibro().saldos[cliente] ?? '0'));
export const totalAdeudado = () => Object.values(leerLibro().saldos).reduce((suma, wei) => suma + BigInt(wei), 0n);
