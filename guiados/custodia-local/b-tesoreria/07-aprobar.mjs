// Paso 7 · Una persona aprueba la propuesta firmando su huella.
// Uso: node b-tesoreria/07-aprobar.mjs <Carla|Diego|Elena|Mallory>
import { guardar, leer } from '../lib/estado.mjs';
import { corto, dato, terminar, titulo } from '../lib/salida.mjs';
import { aprobar, contarAprobaciones, huella, LLAVES_DE_APROBADORES } from '../lib/tesoreria.mjs';

try {
  const nombre = process.argv[2];
  if (!LLAVES_DE_APROBADORES[nombre]) throw new Error('Indica quién aprueba: Carla, Diego, Elena o Mallory.');
  const propuesta = leer('propuesta.json', null);
  if (!propuesta) throw new Error('No hay propuesta. Corre antes: node b-tesoreria/06-proponer.mjs');

  const aprobacion = await aprobar(propuesta, nombre);
  propuesta.aprobaciones.push(aprobacion);
  guardar('propuesta.json', propuesta);
  const cuenta = await contarAprobaciones(propuesta);

  titulo(`${nombre} firma la propuesta`);
  dato('Huella de la propuesta', corto(huella(propuesta), 14, 8));
  dato('Firma', corto(aprobacion.firma, 14, 8));
  dato('Aprobaciones válidas', `${cuenta.validas.length} de ${cuenta.requeridas}${cuenta.validas.length ? ` (${cuenta.validas.join(', ')})` : ''}`);
  for (const d of cuenta.descartadas) dato('Descartada', `${d.nombre}: ${d.motivo}`);
  dato('¿Alcanza el quórum?', cuenta.alcanza ? 'sí' : 'todavía no');
} catch (error) {
  terminar(error);
}
