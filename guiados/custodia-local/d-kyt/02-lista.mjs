// Paso 2 · La pregunta más simple: ¿la dirección está en la lista?
import { direccionDe, listaDeVigilancia, PERSONAJES } from '../lib/kyt.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

try {
  const lista = listaDeVigilancia();
  titulo('Lista de vigilancia (kyt.json)');
  for (const [direccion, entrada] of lista) dato(entrada.nombre, `${direccion} · ${entrada.motivo}`);

  titulo('¿Quién figura en la lista?');
  for (const nombre of PERSONAJES) dato(nombre, lista.has(direccionDe(nombre)) ? 'SÍ figura' : 'no figura');
  nota('La Mula no figura, y todo lo que tiene se lo envió el Mezclador.');
  nota('Mirar solo la lista deja pasar cualquier cosa que esté a un salto de distancia.');
  listo('La lista responde rápido, pero solo ve el primer salto.');
} catch (error) {
  terminar(error);
}
