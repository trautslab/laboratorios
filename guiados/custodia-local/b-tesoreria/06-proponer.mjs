// Paso 6 · La hot se quedó corta: proponer una recarga desde warm.
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { carteras, guardar } from '../lib/estado.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { decidir, ejecutarDesdeWarm, eth, idPropuesta, reglas } from '../lib/tesoreria.mjs';

try {
  await exigirCadena();
  const { hot, warm } = carteras();
  const decision = decidir(await cadena.getBalance({ address: hot.address }));
  if (decision.accion !== 'RECARGAR_DESDE_WARM') throw new Error(`No hace falta recargar: ${decision.motivo}`);

  const propuesta = { id: idPropuesta(), desde: warm.address, hacia: hot.address, wei: decision.wei.toString(), aprobaciones: [] };
  guardar('propuesta.json', propuesta);

  titulo('Propuesta de recarga');
  dato('Motivo', decision.motivo);
  dato('Desde', `warm ${warm.address}`);
  dato('Hacia', `hot ${hot.address}`);
  dato('Monto', `${eth(decision.wei)} ETH (para volver al objetivo)`);
  dato('Aprobaciones requeridas', `${reglas.aprobacionesParaSacarDeWarm} de ${reglas.aprobadores.length} (${reglas.aprobadores.map((a) => a.nombre).join(', ')})`);

  titulo('Intento de ejecutarla sin aprobaciones');
  const intento = await ejecutarDesdeWarm(propuesta, warm);
  dato('¿Se ejecutó?', intento.ejecutada ? 'sí' : `no · ${intento.validas.length} de ${intento.requeridas} aprobaciones`);
  dato('Warm', `${await saldoEnEth(warm.address)} ETH (intacta)`);
  nota('Sacar de warm es mover hacia MENOS seguridad: ahí sí se exige a personas.');
  listo('Propuesta guardada en .estado/propuesta.json, a la espera de aprobaciones.');
} catch (error) {
  terminar(error);
}
