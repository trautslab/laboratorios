// Paso 6 · La política decide antes de que exista una firma.
// Uso: node a-retiro/06-politica.mjs <destino> <monto en ETH>
import { CLIENTE_ANA } from '../lib/config.mjs';
import { cargarPolitica, evaluar } from '../lib/politica.mjs';
import { dato, terminar, titulo } from '../lib/salida.mjs';

try {
  const solicitud = { destino: process.argv[2] ?? CLIENTE_ANA, montoEth: process.argv[3] ?? '0.5' };
  const politica = cargarPolitica();
  const veredicto = evaluar(solicitud, politica);

  titulo('Solicitud de retiro');
  dato('Destino', solicitud.destino);
  dato('Monto', `${solicitud.montoEth} ETH`);
  titulo('Política vigente (politica.json)');
  dato('Límite por retiro', `${politica.limitePorRetiroEth} ETH`);
  dato('Destinos permitidos', politica.destinosPermitidos.map((d) => d.nombre).join(', '));
  titulo('Decisión');
  dato('Resultado', veredicto.decision);
  dato('Regla', veredicto.regla);
  dato('Motivo', veredicto.motivo);
} catch (error) {
  terminar(error);
}
