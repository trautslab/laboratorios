// Paso 3 · Indexar: convertir los bloques en una tabla de quién le pagó a quién.
import { exigirCadena } from '../lib/cadena.mjs';
import { guardar, leer } from '../lib/estado.mjs';
import { eth, indexar, nombres } from '../lib/kyt.mjs';
import { CUENTA_DE_PRUEBA } from '../lib/config.mjs';
import { listo, nota, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirCadena();
  const transferencias = await indexar();
  guardar('transferencias.json', transferencias.map((t) => ({ ...t, wei: t.wei.toString() })));

  const quien = nombres({ Grifo: CUENTA_DE_PRUEBA.address, Custodio: leer('llaves.json').kyt.address });
  const nombre = (direccion) => quien.get(direccion) ?? `${direccion.slice(0, 8)}…`;
  titulo(`Transferencias encontradas: ${transferencias.length}`);
  console.log(['Bloque', 'De', 'A', 'Monto'].map((c, i) => c.padEnd([8, 12, 12, 0][i])).join(''));
  for (const t of transferencias) console.log([String(t.bloque), nombre(t.de), nombre(t.a), `${eth(t.wei)} ETH`].map((c, i) => c.padEnd([8, 12, 12, 0][i])).join(''));
  nota('Esta tabla no existe en el nodo: la armó el script leyendo bloque por bloque.');
  listo('Índice guardado en .estado/transferencias.json.');
} catch (error) {
  terminar(error);
}
