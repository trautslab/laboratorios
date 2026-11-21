// Paso 3 · Lo que la multifirma rechaza, y con qué motivo.
import { parseEther } from 'viem';
import { ANA, dato, exigirCadena, listo, nota, saldoEnEth, terminar, titulo } from './lib/comun.mjs';
import { motivoDeRechazo, multifirma } from './lib/multifirma.mjs';

try {
  await exigirCadena();
  const { address } = multifirma();
  const saldo = await saldoEnEth(address);
  const intento = (firmantes) => motivoDeRechazo({ destino: ANA, valor: parseEther('1'), firmantes });

  titulo('Intentos de retirar 1 ETH que el contrato rechaza');
  dato('Solo Carla', await intento(['Carla']));
  dato('Carla dos veces', await intento(['Carla', 'Carla']));
  dato('Carla y Mallory', await intento(['Carla', 'Mallory']));
  dato('Saldo de la multifirma', `${await saldoEnEth(address)} ETH (antes: ${saldo})`);
  nota('El rechazo lo decide el contrato. No hay servidor que se pueda saltar.');
  listo('Sin dos dueños distintos, la cadena no ejecuta.');
} catch (error) {
  terminar(error);
}
