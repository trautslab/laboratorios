// Paso 4 · Bandas: la hot no debe guardar más de lo necesario. El exceso va a warm.
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { carteras, sumarComision } from '../lib/estado.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { COMISION_FIJA, decidir, eth, mover, reglas } from '../lib/tesoreria.mjs';

try {
  await exigirCadena();
  const { hot, warm } = carteras();
  const saldoHot = await cadena.getBalance({ address: hot.address });
  const decision = decidir(saldoHot);

  titulo('Regla de bandas (tesoreria.json)');
  dato('Bandas mín/obj/máx', `${reglas.hot.minimoEth} / ${reglas.hot.objetivoEth} / ${reglas.hot.maximoEth} ETH`);
  dato('Saldo de la hot', `${eth(saldoHot)} ETH`);
  dato('Decisión', decision.accion);
  dato('Motivo', decision.motivo);

  if (decision.accion === 'GUARDAR_EN_WARM') {
    // Guardar es mover hacia MÁS seguridad: no pide aprobaciones. La comisión sale de la hot.
    await mover(hot, warm.address, decision.wei - COMISION_FIJA);
    sumarComision(COMISION_FIJA);
    titulo('Después de guardar');
    dato('Hot', `${await saldoEnEth(hot.address)} ETH`);
    dato('Warm', `${await saldoEnEth(warm.address)} ETH`);
    nota('Si alguien compromete la hot, lo máximo que puede llevarse es lo que hay en la hot.');
    listo('El exceso está en warm.');
  } else {
    listo('Nada que mover.');
  }
} catch (error) {
  terminar(error);
}
