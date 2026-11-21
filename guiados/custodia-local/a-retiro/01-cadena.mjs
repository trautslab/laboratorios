// Paso 1 · ¿Hay una cadena viva en mi máquina?
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { CUENTA_DE_PRUEBA, RPC_URL } from '../lib/config.mjs';
import { dato, listo, terminar, titulo } from '../lib/salida.mjs';

try {
  const chainId = await exigirCadena();
  const bloque = await cadena.getBlockNumber();

  titulo('Cadena local');
  dato('Nodo', RPC_URL);
  dato('Chain id', chainId);
  dato('Bloque actual', bloque);
  dato('Cuenta de prueba', CUENTA_DE_PRUEBA.address);
  dato('Su saldo', `${await saldoEnEth(CUENTA_DE_PRUEBA.address)} ETH (ficticio)`);
  listo('La cadena responde. Deja esa terminal abierta.');
} catch (error) {
  terminar(error);
}
