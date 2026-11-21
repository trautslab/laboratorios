// Paso 6 · Lo que MPC no deja hacer: firmar con una sola parte.
import { keccak256, toHex } from 'viem';
import { dato, exigir, leer, listo, nota, terminar, titulo } from './lib/comun.mjs';
import { deTexto, firmarEntre } from './lib/mpc.mjs';

try {
  const mpc = exigir(leer('mpc.json'), 'Falta la llave MPC. Corre antes: node 04-generar-llave-mpc.mjs');
  const hash = keccak256(toHex('retiro de prueba'));

  titulo('Intentos de firmar con menos de dos partes');
  for (const nombre of ['Carla', 'Diego', 'Elena']) {
    try {
      await firmarEntre([deTexto(mpc.partes[nombre])], hash, mpc.address);
      dato(`Solo ${nombre}`, 'FIRMÓ (no debería)');
    } catch (error) {
      dato(`Solo ${nombre}`, `no hay firma · el protocolo responde «${error.message ?? error}»`);
    }
  }
  nota('Aquí no hay contrato que rechace: sin la segunda parte, la firma no se puede calcular.');
  nota('El control vive fuera de la cadena, en el protocolo y en quién guarda cada parte.');
  listo('Una parte sola no produce nada utilizable.');
} catch (error) {
  terminar(error);
}
