// Tesorería: reparte los fondos entre wallets con distinto riesgo.
//   depósito → hot (automática, poco saldo) ⇄ warm (el grueso, con aprobaciones humanas)
import { readFileSync } from 'node:fs';
import { formatEther, getAddress, hashMessage, keccak256, parseEther, parseGwei, recoverAddress, serializeTransaction, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { cadena } from './cadena.mjs';
import { CHAIN } from './config.mjs';
import { firmarHash } from './llavero.mjs';

export const reglas = JSON.parse(readFileSync(new URL('../tesoreria.json', import.meta.url), 'utf8'));

// Personas que aprueban. En el laboratorio usan llaves públicas de prueba de Anvil (cuentas 7, 8 y 9);
// en la vida real cada una firma desde su propio dispositivo.
export const LLAVES_DE_APROBADORES = {
  Carla: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  Diego: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
  Elena: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
  // Mallory no está en la lista de aprobadores (cuenta de prueba 6).
  Mallory: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
};

const PRECIO_GAS = parseGwei('2');
const GAS_TRANSFERENCIA = 21_000n;
export const COMISION_FIJA = GAS_TRANSFERENCIA * PRECIO_GAS;

// Mueve ETH desde una wallet cuya llave vive en KMS. Con maxFee = propina, la comisión
// es exactamente gas × precio: así se puede vaciar una dirección sin dejar polvo.
export async function mover(desde, hacia, wei) {
  const tx = {
    type: 'eip1559',
    chainId: CHAIN.id,
    nonce: await cadena.getTransactionCount({ address: desde.address, blockTag: 'pending' }),
    to: hacia,
    value: wei,
    gas: GAS_TRANSFERENCIA,
    maxFeePerGas: PRECIO_GAS,
    maxPriorityFeePerGas: PRECIO_GAS,
  };
  const firma = await firmarHash(desde.keyId, keccak256(serializeTransaction(tx)), desde.address);
  const cruda = serializeTransaction(tx, { r: firma.r, s: firma.s, yParity: firma.yParity });
  const hash = await cadena.sendRawTransaction({ serializedTransaction: cruda });
  return cadena.waitForTransactionReceipt({ hash });
}

// Barrido: todo el saldo de una dirección de depósito, menos la comisión, hacia la hot.
export async function barrer(deposito, hot) {
  const saldo = await cadena.getBalance({ address: deposito.address });
  if (saldo <= COMISION_FIJA) return { movido: 0n, comision: 0n };
  await mover(deposito, hot.address, saldo - COMISION_FIJA);
  return { movido: saldo - COMISION_FIJA, comision: COMISION_FIJA };
}

// La regla de bandas: mira el saldo de la hot y dice qué hacer. Es una función pura.
export function decidir(saldoHotWei, r = reglas) {
  const minimo = parseEther(r.hot.minimoEth);
  const objetivo = parseEther(r.hot.objetivoEth);
  const maximo = parseEther(r.hot.maximoEth);
  if (saldoHotWei > maximo) return { accion: 'GUARDAR_EN_WARM', wei: saldoHotWei - objetivo, motivo: `La hot supera el máximo de ${r.hot.maximoEth} ETH.` };
  if (saldoHotWei < minimo) return { accion: 'RECARGAR_DESDE_WARM', wei: objetivo - saldoHotWei, motivo: `La hot bajó del mínimo de ${r.hot.minimoEth} ETH.` };
  return { accion: 'NADA', wei: 0n, motivo: 'La hot está dentro de la banda.' };
}

// Una propuesta es un dato; su huella (hash) es lo que firman los aprobadores.
// Si alguien cambia el monto o el destino, la huella cambia y las firmas dejan de valer.
export function huella(propuesta) {
  const { id, desde, hacia, wei } = propuesta;
  return hashMessage(JSON.stringify({ id, desde, hacia, wei }));
}

export async function aprobar(propuesta, nombre) {
  const cuenta = privateKeyToAccount(LLAVES_DE_APROBADORES[nombre]);
  const firma = await cuenta.signMessage({ message: JSON.stringify({ id: propuesta.id, desde: propuesta.desde, hacia: propuesta.hacia, wei: propuesta.wei }) });
  return { nombre, firma };
}

// Cuenta aprobaciones válidas: la firma debe corresponder a la huella ACTUAL y venir de
// alguien de la lista. Dos firmas de la misma persona cuentan una vez.
export async function contarAprobaciones(propuesta, r = reglas) {
  const validas = new Map();
  const descartadas = [];
  for (const { nombre, firma } of propuesta.aprobaciones ?? []) {
    const quien = await recoverAddress({ hash: huella(propuesta), signature: firma });
    const aprobador = r.aprobadores.find((a) => getAddress(a.direccion) === quien);
    if (!aprobador) descartadas.push({ nombre, motivo: 'no es aprobador o la propuesta cambió después de firmar' });
    else if (validas.has(aprobador.nombre)) descartadas.push({ nombre, motivo: 'ya había aprobado' });
    else validas.set(aprobador.nombre, quien);
  }
  return { validas: [...validas.keys()], descartadas, requeridas: r.aprobacionesParaSacarDeWarm, alcanza: validas.size >= r.aprobacionesParaSacarDeWarm };
}

// Sacar de warm exige quórum. Sin él, la función se niega y nunca llama al llavero.
export async function ejecutarDesdeWarm(propuesta, warm) {
  const cuenta = await contarAprobaciones(propuesta);
  if (!cuenta.alcanza) return { ejecutada: false, ...cuenta };
  const recibo = await mover(warm, propuesta.hacia, BigInt(propuesta.wei));
  return { ejecutada: true, ...cuenta, recibo };
}

export const eth = (wei) => formatEther(wei);
export const idPropuesta = () => toHex(Date.now()).slice(2);
