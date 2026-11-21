// KYT (know your transaction): mirar de dónde vienen y a dónde van los fondos ANTES de actuar.
// Dos preguntas: ¿la dirección está en una lista? y ¿cuánta de su plata viene de una que sí lo está?
import { readFileSync } from 'node:fs';
import { formatEther, getAddress, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { cadena } from './cadena.mjs';

export const reglas = JSON.parse(readFileSync(new URL('../kyt.json', import.meta.url), 'utf8'));

// Personajes del laboratorio. Sus llaves se derivan de su nombre: son de juguete y reproducibles.
// (Las cuentas de prueba de Anvil no sirven aquí: nacen con 10 000 ETH y diluirían todo.)
export const PERSONAJES = ['Mezclador', 'Mula', 'Empresa', 'Ana', 'Beto', 'Dana', 'Rita'];
export const cuentaDe = (nombre) => privateKeyToAccount(keccak256(toHex(`laboratorio-kyt:${nombre}`)));
export const direccionDe = (nombre) => cuentaDe(nombre).address;

// La lista de vigilancia resuelta a direcciones. Las listas reales las publican reguladores
// (por ejemplo, sanciones) y proveedores de análisis; esta es ficticia y vive en kyt.json.
export function listaDeVigilancia() {
  return new Map(reglas.listaDeVigilancia.map((entrada) => [direccionDe(entrada.nombre), entrada]));
}

// Índice: todas las transferencias de ETH de la cadena, en orden. Un nodo no responde
// "¿quién le pagó a esta dirección?": hay que recorrer los bloques y armar esa tabla.
export async function indexar() {
  // cacheTime 0: viem recuerda el último bloque unos segundos; aquí hace falta el dato fresco.
  const ultimo = await cadena.getBlockNumber({ cacheTime: 0 });
  const transferencias = [];
  for (let n = 1n; n <= ultimo; n += 1n) {
    const bloque = await cadena.getBlock({ blockNumber: n, includeTransactions: true });
    for (const tx of bloque.transactions) {
      if (tx.to && tx.value > 0n) transferencias.push({ bloque: Number(n), de: getAddress(tx.from), a: getAddress(tx.to), wei: tx.value });
    }
  }
  return transferencias;
}

// Exposición por arrastre proporcional: cada dirección lleva la cuenta de cuánto de lo que recibió
// viene de una dirección listada. Al enviar, arrastra esa misma proporción. Una dirección listada
// contamina el 100 % de lo que envía.
export function calcularExposicion(transferencias, lista = listaDeVigilancia()) {
  const cuentas = new Map(); // dirección → { recibido, expuesto, saltos }
  const de = (direccion) => {
    if (!cuentas.has(direccion)) cuentas.set(direccion, { recibido: 0n, expuesto: 0n, saltos: lista.has(direccion) ? 0 : Infinity });
    return cuentas.get(direccion);
  };
  const porTransferencia = [];
  for (const t of transferencias) {
    const origen = de(t.de);
    const destino = de(t.a);
    const proporcion = lista.has(t.de) ? 1 : origen.recibido === 0n ? 0 : Number((origen.expuesto * 1_000_000n) / origen.recibido) / 1_000_000;
    const expuesto = (t.wei * BigInt(Math.round(proporcion * 1_000_000))) / 1_000_000n;
    destino.recibido += t.wei;
    destino.expuesto += expuesto;
    if (expuesto > 0n) destino.saltos = Math.min(destino.saltos, origen.saltos + 1);
    porTransferencia.push({ ...t, proporcion });
  }
  return { cuentas, porTransferencia };
}

export function exposicionDe(direccion, cuentas, lista = listaDeVigilancia()) {
  const cuenta = cuentas.get(getAddress(direccion));
  if (lista.has(getAddress(direccion))) return { listada: true, proporcion: 1, saltos: 0 };
  if (!cuenta || cuenta.recibido === 0n) return { listada: false, proporcion: 0, saltos: Infinity };
  return { listada: false, proporcion: Number((cuenta.expuesto * 1_000_000n) / cuenta.recibido) / 1_000_000, saltos: cuenta.saltos };
}

// De un número a una acción. Es una función pura: misma exposición, misma decisión.
export function decidir(exposicion, r = reglas) {
  if (exposicion.listada) return { decision: 'BLOQUEAR', regla: 'direccion-listada', motivo: 'La dirección está en la lista de vigilancia.' };
  if (exposicion.proporcion >= r.bloquearDesde) return { decision: 'BLOQUEAR', regla: 'exposicion-alta', motivo: `Exposición de ${pct(exposicion.proporcion)}, sobre el umbral de bloqueo (${pct(r.bloquearDesde)}).` };
  if (exposicion.proporcion >= r.revisarDesde) return { decision: 'REVISAR', regla: 'exposicion-media', motivo: `Exposición de ${pct(exposicion.proporcion)}: la decide una persona.` };
  return { decision: 'PERMITIR', regla: 'exposicion-baja', motivo: `Exposición de ${pct(exposicion.proporcion)}, bajo el umbral de revisión (${pct(r.revisarDesde)}).` };
}

export const pct = (proporcion) => `${(proporcion * 100).toFixed(1).replace('.0', '')} %`;
export const saltosTexto = (saltos) => (saltos === 0 ? 'listada' : saltos === Infinity ? 'sin relación' : `${saltos} ${saltos === 1 ? 'salto' : 'saltos'}`);
export const eth = (wei) => formatEther(wei);

// Para mostrar nombres en lugar de direcciones.
export function nombres(extra = {}) {
  return new Map([...PERSONAJES.map((nombre) => [direccionDe(nombre), nombre]), ...Object.entries(extra).map(([nombre, direccion]) => [getAddress(direccion), nombre])]);
}
