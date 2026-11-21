// Paso 8 · El registro: la evidencia que pediría cumplimiento o un auditor.
import { leerRegistro } from '../lib/estado.mjs';
import { pct } from '../lib/kyt.mjs';
import { listo, terminar, titulo } from '../lib/salida.mjs';

try {
  const eventos = leerRegistro();
  if (eventos.length === 0) throw new Error('El registro está vacío. Corre antes los pasos 5 a 7.');
  const anchos = [3, 10, 20, 12, 10, 19, 0];
  const fila = (celdas) => console.log(celdas.map((c, i) => String(c).padEnd(anchos[i])).join(' '));

  titulo('Registro de decisiones (.estado/registro.jsonl)');
  fila(['#', 'Tipo', 'Movimiento', 'Exposición', 'Decisión', 'Regla', 'Resultado']);
  eventos.forEach((e, i) => {
    const movimiento = e.tipo === 'depósito' ? `${e.cliente} +${e.montoEth} ETH` : e.tipo === 'retiro' ? `→ ${e.destino} ${e.montoEth} ETH` : `caso ${e.destino} (${e.analista})`;
    fila([i + 1, e.tipo, movimiento, e.exposicion === undefined ? '—' : pct(e.exposicion), e.decision, e.regla, e.tipo === 'revisión' ? `${e.resultado} · «${e.motivo}»` : e.resultado]);
  });
  const cuenta = (decision) => eventos.filter((e) => e.decision === decision).length;
  listo(`${eventos.length} líneas: ${cuenta('PERMITIR')} permitidas, ${cuenta('REVISAR')} a revisión, ${cuenta('BLOQUEAR')} bloqueadas, ${cuenta('APROBADA') + cuenta('RECHAZADA')} resuelta por una analista y ${cuenta('IGNORADA')} intento sin permiso.`);
} catch (error) {
  terminar(error);
}
