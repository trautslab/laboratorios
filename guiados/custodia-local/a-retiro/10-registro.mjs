// Paso 10 · Leer el registro de auditoría: qué se pidió, qué se decidió y por qué.
import { leerRegistro } from '../lib/estado.mjs';
import { CLIENTE_ANA, CLIENTE_LUIS } from '../lib/config.mjs';
import { listo, terminar, titulo } from '../lib/salida.mjs';

try {
  const nombres = { [CLIENTE_ANA]: 'Ana', [CLIENTE_LUIS]: 'Luis' };
  const eventos = leerRegistro();
  if (eventos.length === 0) throw new Error('El registro está vacío. Corre antes los pasos 8 y 9.');

  titulo('Registro de auditoría (.estado/registro.jsonl)');
  console.log(['#', 'Destino', 'Monto', 'Decisión', 'Regla', 'Firmado', 'Resultado'].map((c, i) => c.padEnd([2, 12, 9, 9, 22, 8, 0][i])).join(' '));
  eventos.forEach((e, i) => {
    const resultado = e.firmado ? `bloque ${e.bloque}, ${e.estado}` : e.error ? `KMS: ${e.error}` : 'no llegó al llavero';
    console.log(
      [String(i + 1), nombres[e.destino] ?? 'desconocido', `${e.montoEth} ETH`, e.decision, e.regla, e.firmado ? 'sí' : 'no', resultado]
        .map((c, j) => c.padEnd([2, 12, 9, 9, 22, 8, 0][j]))
        .join(' '),
    );
  });
  const firmados = eventos.filter((e) => e.firmado).length;
  listo(`${eventos.length} solicitudes, ${firmados} firmadas, ${eventos.length - firmados} frenadas. Cada una con su motivo.`);
} catch (error) {
  terminar(error);
}
