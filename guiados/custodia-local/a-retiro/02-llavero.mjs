// Paso 2 · ¿Hay un llavero (KMS) vivo en mi máquina?
import { KMS_ENDPOINT } from '../lib/config.mjs';
import { exigirLlavero } from '../lib/llavero.mjs';
import { dato, listo, terminar, titulo } from '../lib/salida.mjs';

try {
  const salud = await exigirLlavero();

  titulo('Llavero local');
  dato('Servicio', `Floci ${salud.version} (emula AWS)`);
  dato('Dirección', KMS_ENDPOINT);
  dato('KMS', salud.services.kms);
  dato('Credenciales', 'ficticias (test / test)');
  listo('El llavero responde. No hay cuenta de nube de por medio.');
} catch (error) {
  terminar(error);
}
