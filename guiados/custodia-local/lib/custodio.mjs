// El custodio: junta política, llavero y cadena en el orden correcto.
//   solicitud → política → construir → firmar (KMS) → enviar → recibo → registro
import { keccak256, parseEther, parseGwei, serializeTransaction } from 'viem';
import { cadena } from './cadena.mjs';
import { CHAIN } from './config.mjs';
import { anotar } from './estado.mjs';
import { firmarHash } from './llavero.mjs';
import { evaluar } from './politica.mjs';

// Construye la transacción SIN firma. Es un objeto con campos, como el body de un POST.
export async function construirRetiro(origen, solicitud) {
  return {
    type: 'eip1559',
    chainId: CHAIN.id, // amarra la firma a esta cadena: no sirve en otra
    nonce: await cadena.getTransactionCount({ address: origen, blockTag: 'pending' }), // n.º de orden de esta cuenta
    to: solicitud.destino,
    value: parseEther(solicitud.montoEth), // 1 ETH = 10^18 wei; viem usa BigInt
    gas: 21_000n, // una transferencia simple cuesta siempre 21 000 de gas
    maxFeePerGas: parseGwei('2'),
    maxPriorityFeePerGas: parseGwei('1'),
  };
}

// Lo que se firma no es el objeto: es el hash de su forma serializada.
export function hashParaFirmar(tx) {
  return keccak256(serializeTransaction(tx));
}

export async function firmarRetiro(llave, tx) {
  const firma = await firmarHash(llave.keyId, hashParaFirmar(tx), llave.address);
  const cruda = serializeTransaction(tx, { r: firma.r, s: firma.s, yParity: firma.yParity });
  return { firma, cruda, hash: keccak256(cruda) };
}

export async function enviarRetiro(cruda) {
  const hash = await cadena.sendRawTransaction({ serializedTransaction: cruda });
  return cadena.waitForTransactionReceipt({ hash });
}

// Flujo completo, como lo llamaría la API de un custodio. Cada decisión queda en el registro.
export async function retirar(llave, solicitud) {
  const cuando = new Date().toISOString();
  const veredicto = evaluar(solicitud);
  if (veredicto.decision === 'RECHAZAR') {
    anotar({ cuando, ...solicitud, ...veredicto, firmado: false });
    return { ...veredicto, firmado: false };
  }
  const tx = await construirRetiro(llave.address, solicitud);
  let firmado;
  try {
    firmado = await firmarRetiro(llave, tx);
  } catch (error) {
    // La política aprobó, pero el llavero se negó (por ejemplo, llave deshabilitada).
    anotar({ cuando, ...solicitud, ...veredicto, firmado: false, error: error.name });
    return { ...veredicto, firmado: false, error: error.name, detalle: error.message };
  }
  const { cruda, hash } = firmado;
  const recibo = await enviarRetiro(cruda);
  anotar({ cuando, ...solicitud, ...veredicto, firmado: true, nonce: tx.nonce, hash, bloque: Number(recibo.blockNumber), estado: recibo.status });
  return { ...veredicto, firmado: true, tx, hash, recibo };
}
