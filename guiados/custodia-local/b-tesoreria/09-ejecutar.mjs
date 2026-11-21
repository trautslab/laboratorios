// Paso 9 · Ejecutar la recarga: solo si el quórum está completo.
import { exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { carteras, leer, sumarComision } from '../lib/estado.mjs';
import { dato, listo, terminar, titulo } from '../lib/salida.mjs';
import { COMISION_FIJA, ejecutarDesdeWarm, eth } from '../lib/tesoreria.mjs';

try {
  await exigirCadena();
  const { hot, warm } = carteras();
  const propuesta = leer('propuesta.json', null);
  if (!propuesta) throw new Error('No hay propuesta. Corre antes: node b-tesoreria/06-proponer.mjs');

  const resultado = await ejecutarDesdeWarm(propuesta, warm);
  titulo('Ejecución de la recarga');
  dato('Aprobaciones válidas', `${resultado.validas.length} de ${resultado.requeridas}${resultado.validas.length ? ` (${resultado.validas.join(', ')})` : ''}`);
  if (!resultado.ejecutada) {
    dato('¿Se ejecutó?', 'no · falta quórum, la llave de warm no se usó');
    process.exit(0);
  }
  sumarComision(COMISION_FIJA);
  dato('¿Se ejecutó?', `sí, bloque ${resultado.recibo.blockNumber}`);
  dato('Monto', `${eth(BigInt(propuesta.wei))} ETH`);
  dato('Hot', `${await saldoEnEth(hot.address)} ETH`);
  dato('Warm', `${await saldoEnEth(warm.address)} ETH`);
  listo('La hot volvió a su objetivo con dos aprobaciones humanas.');
} catch (error) {
  terminar(error);
}
