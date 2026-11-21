// Paso 5 · Retiros de clientes: salen de la hot, sin intervención humana.
import { parseEther } from 'viem';
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { CLIENTE_ANA, CLIENTE_LUIS } from '../lib/config.mjs';
import { carteras, sumarComision } from '../lib/estado.mjs';
import { debitar, saldoCliente } from '../lib/libro.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { COMISION_FIJA, decidir, mover } from '../lib/tesoreria.mjs';

const DESTINOS = { Ana: CLIENTE_ANA, Luis: CLIENTE_LUIS };
const SOLICITUDES = [
  ['Ana', '1'],
  ['Luis', '1'],
  ['Ana', '1'],
  ['Ana', '1'],
  ['Luis', '4'], // pide más de lo que el libro dice que es suyo
];

try {
  await exigirCadena();
  const { hot } = carteras();

  titulo('Retiros atendidos por la hot');
  for (const [cliente, montoEth] of SOLICITUDES) {
    try {
      // Primero el libro: si el cliente no tiene saldo, no se toca la cadena.
      debitar(cliente, montoEth, 'retiro');
      const recibo = await mover(hot, DESTINOS[cliente], parseEther(montoEth));
      sumarComision(COMISION_FIJA);
      dato(`${cliente} retira ${montoEth} ETH`, `enviado, bloque ${recibo.blockNumber}`);
    } catch (error) {
      dato(`${cliente} retira ${montoEth} ETH`, `RECHAZADO · ${error.message}`);
    }
  }

  titulo('Después de los retiros');
  dato('Libro · Ana', `${saldoCliente('Ana')} ETH`);
  dato('Libro · Luis', `${saldoCliente('Luis')} ETH`);
  const saldoHot = await cadena.getBalance({ address: hot.address });
  dato('Hot', `${await saldoEnEth(hot.address)} ETH`);
  dato('Regla de bandas', `${decidir(saldoHot).accion} · ${decidir(saldoHot).motivo}`);
  nota('La hot tenía fondos de sobra para los 4 ETH de Luis, pero no eran de Luis.');
  listo('Cuatro retiros enviados y uno rechazado por el libro.');
} catch (error) {
  terminar(error);
}
