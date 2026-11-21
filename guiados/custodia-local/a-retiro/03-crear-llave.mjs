// Paso 3 · Crear la llave del custodio DENTRO del llavero.
import { guardar, leer } from '../lib/estado.mjs';
import { crearLlave, exigirLlavero } from '../lib/llavero.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirLlavero();
  const llave = await crearLlave('Wallet caliente del custodio (laboratorio)');

  // Guardamos solo el identificador. La llave privada no está en este archivo ni en ningún otro.
  guardar('llaves.json', { ...leer('llaves.json'), llaveCaliente: { keyId: llave.KeyId } });

  titulo('Llave creada en KMS');
  dato('Identificador', llave.KeyId);
  dato('Curva', `${llave.KeySpec} (la de Ethereum)`);
  dato('Uso', llave.KeyUsage);
  dato('Estado', llave.KeyState);
  nota('KMS no tiene ninguna operación para exportar la llave privada.');
  nota('Lo único que guardamos en .estado/llaves.json es el identificador.');
  listo('La llave existe y solo KMS puede usarla.');
} catch (error) {
  terminar(error);
}
