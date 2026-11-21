// Paso 3 · Barrido: juntar los depósitos en la wallet hot.
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { carteras, sumarComision } from '../lib/estado.mjs';
import { saldoCliente } from '../lib/libro.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { barrer, eth } from '../lib/tesoreria.mjs';

try {
  await exigirCadena();
  const { depositos, hot } = carteras();

  titulo('Barrido de depósitos a la hot');
  for (const [nombre, deposito] of Object.entries(depositos)) {
    const { movido, comision } = await barrer(deposito, hot);
    sumarComision(comision);
    dato(`De ${nombre}`, `${eth(movido)} ETH movidos, ${eth(comision)} ETH de comisión`);
  }

  titulo('En la cadena');
  dato('Depósitos de Ana', `${await saldoEnEth(depositos.Ana.address)} ETH`);
  dato('Depósitos de Luis', `${await saldoEnEth(depositos.Luis.address)} ETH`);
  dato('Hot', `${await saldoEnEth(hot.address)} ETH`);
  titulo('En el libro (no cambió)');
  dato('Ana', `${saldoCliente('Ana')} ETH`);
  dato('Luis', `${saldoCliente('Luis')} ETH`);
  nota('Mover fondos entre carteras propias no cambia lo que se le debe a cada cliente.');
  nota('La comisión del barrido la absorbe el custodio: el cliente sigue teniendo 6 y 4.');
  listo(`Bloque ${await cadena.getBlockNumber()}: los depósitos quedaron vacíos y la hot concentra los fondos.`);
} catch (error) {
  terminar(error);
}
