// Paso 6 · Retiros: revisar el destino ANTES de pedir la firma.
import { parseEther } from 'viem';
import { exigirCadena } from '../lib/cadena.mjs';
import { anotar, guardar, leer } from '../lib/estado.mjs';
import { calcularExposicion, decidir, direccionDe, exposicionDe, indexar, pct, saltosTexto } from '../lib/kyt.mjs';
import { contador } from '../lib/llavero.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { mover } from '../lib/tesoreria.mjs';

// Ana pide cuatro retiros de 0.5 ETH hacia destinos distintos.
const DESTINOS = ['Ana', 'Mezclador', 'Mula', 'Dana'];

try {
  await exigirCadena();
  const custodio = leer('llaves.json').kyt;
  if (!custodio) throw new Error('Falta el escenario. Corre antes: node d-kyt/01-escenario.mjs');
  const { cuentas } = calcularExposicion(await indexar());
  const pendientes = [];

  titulo('Retiros de 0.5 ETH: revisión del destino');
  for (const destino of DESTINOS) {
    const exposicion = exposicionDe(direccionDe(destino), cuentas);
    const veredicto = decidir(exposicion);
    let resultado = 'no se firma';
    if (veredicto.decision === 'PERMITIR') {
      const recibo = await mover(custodio, direccionDe(destino), parseEther('0.5'));
      resultado = `firmado y enviado, bloque ${recibo.blockNumber}`;
    } else if (veredicto.decision === 'REVISAR') {
      pendientes.push({ destino, montoEth: '0.5', exposicion: exposicion.proporcion });
      resultado = 'en espera de una persona';
    }
    anotar({ cuando: new Date().toISOString(), tipo: 'retiro', cliente: 'Ana', destino, montoEth: '0.5', exposicion: exposicion.proporcion, ...veredicto, resultado });
    dato(`Hacia ${destino}`, `${pct(exposicion.proporcion)}, ${saltosTexto(exposicion.saltos)} → ${veredicto.decision} · ${resultado}`);
  }
  guardar('pendientes.json', pendientes);

  titulo('Resumen');
  dato('Firmas pedidas a KMS', contador.firmas);
  dato('En espera de revisión', pendientes.map((p) => p.destino).join(', ') || 'ninguno');
  nota('Una transacción enviada no se deshace. Por eso el destino se revisa antes de firmar.');
  listo('De cuatro retiros se firmó uno. Los otros tres nunca llegaron al llavero.');
} catch (error) {
  terminar(error);
}
