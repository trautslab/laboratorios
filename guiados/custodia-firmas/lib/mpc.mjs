// Firma por umbral (MPC): tres partes generan UNA llave sin que ninguna la tenga entera,
// y dos de ellas producen una firma ECDSA normal. Protocolo DKLs23, librería de Silence
// Laboratories bajo licencia de uso no comercial (ver NOTICE.md).
//
// En la vida real cada parte corre en una máquina distinta y los mensajes viajan cifrados
// por la red. Aquí las tres corren en este proceso y los mensajes se pasan a mano, para
// que se vea el protocolo completo.
import { Keyshare, KeygenSession, SignSession } from '@silencelaboratories/dkls-wasm-ll-node';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { bytesToHex, getAddress, hexToBytes, keccak256, recoverAddress } from 'viem';

// Reparto de mensajes: los de «difusión» van a todos menos a quien los envió;
// los «privados» van solo a su destinatario.
const paraTodosMenos = (mensajes, yo) => mensajes.filter((m) => m.from_id !== yo).map((m) => m.clone());
const soloPara = (mensajes, yo) => mensajes.filter((m) => m.to_id === yo).map((m) => m.clone());

// Las cuatro rondas de la generación de llave. Devuelve una parte (keyshare) por participante.
function rondasDeGeneracion(sesiones) {
  const r1 = sesiones.map((s) => s.createFirstMessage());
  const r2 = sesiones.flatMap((s, i) => s.handleMessages(paraTodosMenos(r1, i)));
  const compromisos = sesiones.map((s) => s.calculateChainCodeCommitment());
  const r3 = sesiones.flatMap((s, i) => s.handleMessages(soloPara(r2, i)));
  const r4 = sesiones.flatMap((s, i) => s.handleMessages(soloPara(r3, i), compromisos));
  sesiones.forEach((s, i) => s.handleMessages(paraTodosMenos(r4, i)));
  return { partes: sesiones.map((s) => s.keyshare()), mensajes: r1.length + r2.length + r3.length + r4.length };
}

// Generación distribuida de la llave: n participantes, hacen falta t para firmar.
export function generarLlave(n, t) {
  return rondasDeGeneracion(Array.from({ length: n }, (_, i) => new KeygenSession(n, t, i)));
}

// Rotación: las mismas personas renuevan sus partes. La llave pública (y la dirección) no cambia.
export function rotar(partes) {
  const viejas = partes.map(copiar);
  const { partes: nuevas, mensajes } = rondasDeGeneracion(partes.map((parte) => KeygenSession.initKeyRotation(copiar(parte))));
  nuevas.forEach((nueva, i) => nueva.finishKeyRotation(viejas[i]));
  return { partes: nuevas, mensajes };
}

// Firma conjunta de un hash de 32 bytes. Cada participante aporta su parte; la llave
// completa no se reconstruye en ningún momento.
export async function firmarEntre(partes, hash, direccionEsperada) {
  const sesiones = partes.map((parte) => new SignSession(copiar(parte), 'm'));
  const r1 = sesiones.map((s) => s.createFirstMessage());
  const ids = r1.map((m) => m.from_id);
  const r2 = sesiones.flatMap((s, i) => s.handleMessages(paraTodosMenos(r1, ids[i])));
  const r3 = sesiones.flatMap((s, i) => s.handleMessages(soloPara(r2, ids[i])));
  sesiones.forEach((s, i) => s.handleMessages(soloPara(r3, ids[i])));
  const r4 = sesiones.map((s) => s.lastMessage(hexToBytes(hash)));
  const [r, s] = sesiones.map((sesion, i) => sesion.combine(paraTodosMenos(r4, ids[i])))[0];

  // Igual que con KMS: falta saber cuál de los dos puntos posibles es (yParity).
  for (const yParity of [0, 1]) {
    const firma = { r: bytesToHex(r), s: bytesToHex(s), yParity };
    if ((await recoverAddress({ hash, signature: firma })) === direccionEsperada) return { firma, mensajes: r1.length + r2.length + r3.length + r4.length };
  }
  throw new Error('La firma conjunta no corresponde a la dirección esperada');
}

// La llave pública llega comprimida (33 bytes). Se descomprime y se calcula la dirección
// igual que siempre: últimos 20 bytes de keccak256(X || Y).
export function direccionDe(parte) {
  const punto = secp256k1.Point.fromBytes(parte.publicKey).toBytes(false);
  return getAddress(`0x${keccak256(punto.slice(1)).slice(-40)}`);
}

// Las partes se guardan en disco como base64. Cada archivo es el secreto de UNA persona.
export const aTexto = (parte) => Buffer.from(parte.toBytes()).toString('base64');
export const deTexto = (texto) => Keyshare.fromBytes(new Uint8Array(Buffer.from(texto, 'base64')));
const copiar = (parte) => Keyshare.fromBytes(parte.toBytes());
