// Paso 7 · Una persona resuelve el caso en revisión y deja su motivo por escrito.
// Uso: node d-kyt/07-revisar.mjs <analista> <aprobar|rechazar> "<motivo>"
import { parseEther } from 'viem';
import { exigirCadena } from '../lib/cadena.mjs';
import { anotar, guardar, leer } from '../lib/estado.mjs';
import { direccionDe, pct, reglas } from '../lib/kyt.mjs';
import { dato, listo, terminar, titulo } from '../lib/salida.mjs';
import { mover } from '../lib/tesoreria.mjs';

try {
  await exigirCadena();
  const [analista, accion, motivo] = process.argv.slice(2);
  if (!['aprobar', 'rechazar'].includes(accion) || !motivo) throw new Error('Uso: node d-kyt/07-revisar.mjs <analista> <aprobar|rechazar> "<motivo>"');

  const pendientes = leer('pendientes.json', []);
  const caso = pendientes[0];
  if (!caso) throw new Error('No hay casos en revisión. Corre antes: node d-kyt/06-retiros.mjs');

  titulo('Caso en revisión');
  dato('Retiro', `${caso.montoEth} ETH de Ana hacia ${caso.destino}`);
  dato('Exposición del destino', pct(caso.exposicion));
  dato('Quien decide', analista);

  // El sistema no acepta la decisión de cualquiera: solo de quien figura como analista.
  if (!reglas.analistas.includes(analista)) {
    dato('Resultado', `RECHAZADO · ${analista} no figura como analista en kyt.json`);
    anotar({ cuando: new Date().toISOString(), tipo: 'revisión', destino: caso.destino, analista, decision: 'IGNORADA', regla: 'no-es-analista', motivo, resultado: 'el caso sigue en espera' });
    process.exit(0);
  }

  let resultado = 'retiro cancelado, no se firma';
  if (accion === 'aprobar') {
    const custodio = leer('llaves.json').kyt;
    const recibo = await mover(custodio, direccionDe(caso.destino), parseEther(caso.montoEth));
    resultado = `firmado y enviado, bloque ${recibo.blockNumber}`;
  }
  guardar('pendientes.json', pendientes.slice(1));
  anotar({ cuando: new Date().toISOString(), tipo: 'revisión', destino: caso.destino, analista, decision: accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA', regla: 'decision-humana', motivo, resultado });
  dato('Decisión', accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA');
  dato('Motivo', motivo);
  dato('Resultado', resultado);
  listo('El caso quedó cerrado, con nombre y motivo.');
} catch (error) {
  terminar(error);
}
