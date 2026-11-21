// Paso 8 · ¿Y si alguien cambia el monto después de las aprobaciones?
import { parseEther } from 'viem';
import { leer } from '../lib/estado.mjs';
import { corto, dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { contarAprobaciones, eth, huella } from '../lib/tesoreria.mjs';

try {
  const propuesta = leer('propuesta.json', null);
  if (!propuesta) throw new Error('No hay propuesta. Corre antes los pasos 6 y 7.');

  // Copia alterada: mismo id y mismas firmas, pero pide 40 ETH. No se guarda en disco.
  const alterada = { ...propuesta, wei: parseEther('40').toString() };
  const original = await contarAprobaciones(propuesta);
  const trampa = await contarAprobaciones(alterada);

  titulo('Propuesta original');
  dato('Monto', `${eth(BigInt(propuesta.wei))} ETH`);
  dato('Huella', corto(huella(propuesta), 14, 8));
  dato('Aprobaciones válidas', `${original.validas.length} de ${original.requeridas}`);
  titulo('La misma propuesta con el monto cambiado');
  dato('Monto', `${eth(BigInt(alterada.wei))} ETH`);
  dato('Huella', corto(huella(alterada), 14, 8));
  dato('Aprobaciones válidas', `${trampa.validas.length} de ${trampa.requeridas}`);
  nota('Las firmas son sobre la huella. Otro monto, otra huella: las firmas ya no corresponden.');
  listo('Una aprobación vale solo para lo que la persona vio.');
} catch (error) {
  terminar(error);
}
