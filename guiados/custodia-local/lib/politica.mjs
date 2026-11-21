// La política decide ANTES de firmar. Es una función pura: recibe la solicitud y las reglas,
// y devuelve aprobar o rechazar con el motivo. No toca ni la cadena ni el llavero.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getAddress, parseEther } from 'viem';

export function cargarPolitica(url = new URL('../politica.json', import.meta.url)) {
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
}

export function evaluar(solicitud, politica = cargarPolitica()) {
  const destino = getAddress(solicitud.destino);
  const permitido = politica.destinosPermitidos.find((d) => getAddress(d.direccion) === destino);
  if (!permitido) return { decision: 'RECHAZAR', regla: 'destino-no-permitido', motivo: 'El destino no está en la lista de direcciones dadas de alta.' };

  if (parseEther(solicitud.montoEth) > parseEther(politica.limitePorRetiroEth)) {
    return { decision: 'RECHAZAR', regla: 'limite-por-retiro', motivo: `El monto supera el límite de ${politica.limitePorRetiroEth} ETH por retiro.` };
  }
  return { decision: 'APROBAR', regla: 'dentro-de-politica', motivo: `Destino conocido (${permitido.nombre}) y monto dentro del límite.` };
}
