// Paso 4 · Exposición: cuánto de lo que recibió cada dirección viene de una dirección listada.
import { exigirCadena } from '../lib/cadena.mjs';
import { calcularExposicion, decidir, direccionDe, exposicionDe, indexar, pct, PERSONAJES, reglas, saltosTexto } from '../lib/kyt.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirCadena();
  const { cuentas } = calcularExposicion(await indexar());

  titulo('Umbrales (kyt.json)');
  dato('Revisar desde', pct(reglas.revisarDesde));
  dato('Bloquear desde', pct(reglas.bloquearDesde));

  titulo('Exposición por dirección');
  console.log(['Quién', 'Exposición', 'Distancia', 'Decisión'].map((c, i) => c.padEnd([12, 13, 15, 0][i])).join(''));
  for (const nombre of PERSONAJES) {
    const e = exposicionDe(direccionDe(nombre), cuentas);
    console.log([nombre, pct(e.proporcion), saltosTexto(e.saltos), decidir(e).decision].map((c, i) => c.padEnd([12, 13, 15, 0][i])).join(''));
  }
  nota('La Mula no está en ninguna lista y aun así sale con 100 %: todo lo suyo vino del Mezclador.');
  nota('Beto recibió algo de la Mula, pero es el 5 % de lo suyo: queda bajo el umbral.');
  listo('Cada dirección tiene ahora un número, y cada número una acción.');
} catch (error) {
  terminar(error);
}
