// Paso 2 · Un retiro con multifirma: dos dueñas firman, cualquiera lo envía.
import { parseEther } from 'viem';
import { ANA, corto, dato, exigirCadena, guardar, leer, listo, nota, saldoEnEth, terminar, titulo } from './lib/comun.mjs';
import { ejecutar, multifirma } from './lib/multifirma.mjs';

try {
  await exigirCadena();
  const { address } = multifirma();
  const antes = await saldoEnEth(ANA);
  const { recibo, huella, firmas } = await ejecutar({ destino: ANA, valor: parseEther('1'), firmantes: ['Carla', 'Diego'] });
  guardar('retiros.json', { ...(leer('retiros.json') ?? {}), multifirma: recibo.transactionHash });

  titulo('Retiro de 1 ETH a Ana con multifirma');
  dato('Huella que se firma', corto(huella));
  for (const f of firmas) dato(`Firma de ${f.nombre}`, corto(f.firma));
  dato('Quién envió la transacción', 'el grifo (no es dueño: solo paga el gas)');
  titulo('Recibo');
  dato('Estado', recibo.status);
  dato('Destino de la transacción', `${recibo.to} (el contrato)`);
  dato('Gas usado', recibo.gasUsed);
  dato('Ana antes / después', `${antes} / ${await saldoEnEth(ANA)} ETH`);
  dato('Saldo de la multifirma', `${await saldoEnEth(address)} ETH`);
  nota('Las dos firmas viajan dentro de la transacción y el contrato las comprueba una por una.');
  listo('El contrato contó dos firmas válidas y pagó.');
} catch (error) {
  terminar(error);
}
