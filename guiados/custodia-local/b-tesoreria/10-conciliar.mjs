// Paso 10 · Conciliar: lo que hay en la cadena contra lo que dice el libro.
import { cadena, exigirCadena } from '../lib/cadena.mjs';
import { carteras, leer } from '../lib/estado.mjs';
import { saldoCliente, totalAdeudado } from '../lib/libro.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';
import { eth } from '../lib/tesoreria.mjs';

try {
  await exigirCadena();
  const { depositos, hot, warm } = carteras();
  const saldo = (address) => cadena.getBalance({ address });
  const enDepositos = (await saldo(depositos.Ana.address)) + (await saldo(depositos.Luis.address));
  const enHot = await saldo(hot.address);
  const enWarm = await saldo(warm.address);
  const activos = enDepositos + enHot + enWarm;
  const pasivos = totalAdeudado();
  const { capitalPropioWei, comisionesWei } = leer('cuentas.json');
  const esperado = pasivos + BigInt(capitalPropioWei) - BigInt(comisionesWei);

  titulo('Activos: lo que hay en la cadena');
  dato('Depósitos', `${eth(enDepositos)} ETH`);
  dato('Hot', `${eth(enHot)} ETH`);
  dato('Warm', `${eth(enWarm)} ETH`);
  dato('Total de activos', `${eth(activos)} ETH`);
  titulo('Pasivos: lo que se le debe a los clientes');
  dato('Ana', `${saldoCliente('Ana')} ETH`);
  dato('Luis', `${saldoCliente('Luis')} ETH`);
  dato('Total de pasivos', `${eth(pasivos)} ETH`);
  titulo('La cuenta que tiene que cerrar: pasivos + capital − comisiones');
  dato('Capital propio', `${eth(BigInt(capitalPropioWei))} ETH`);
  dato('Comisiones pagadas', `${eth(BigInt(comisionesWei))} ETH`);
  dato('Debería haber', `${eth(esperado)} ETH`);
  dato('Activos en la cadena', `${eth(activos)} ETH`);
  dato('Diferencia', `${activos - esperado} wei`);
  if (activos !== esperado) throw new Error('La conciliación no cierra: hay un movimiento sin anotar.');
  nota('Los activos cubren todo lo adeudado y sobra el capital propio menos lo gastado en comisiones.');
  listo('Conciliación exacta, al wei.');
} catch (error) {
  terminar(error);
}
