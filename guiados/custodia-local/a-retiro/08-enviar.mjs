// Paso 8 · Enviar la transacción firmada y leer el recibo.
import { formatEther } from 'viem';
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { enviarRetiro } from '../lib/custodio.mjs';
import { anotar, leer, llaveCaliente } from '../lib/estado.mjs';
import { dato, listo, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirCadena();
  const llave = llaveCaliente();
  const pendiente = leer('retiro-firmado.json', null);
  if (!pendiente) throw new Error('No hay retiro firmado. Corre antes: node a-retiro/07-firmar.mjs');
  const { solicitud, cruda } = pendiente;

  const antes = { custodio: await saldoEnEth(llave.address), destino: await saldoEnEth(solicitud.destino) };
  const recibo = await enviarRetiro(cruda);
  const comision = recibo.gasUsed * recibo.effectiveGasPrice;
  anotar({ cuando: new Date().toISOString(), ...solicitud, decision: 'APROBAR', regla: 'dentro-de-politica', firmado: true, nonce: pendiente.nonce, hash: recibo.transactionHash, bloque: Number(recibo.blockNumber), estado: recibo.status });

  titulo('Recibo');
  dato('Estado', recibo.status);
  dato('Transacción', recibo.transactionHash);
  dato('Bloque', recibo.blockNumber);
  dato('Gas usado', recibo.gasUsed);
  dato('Comisión pagada', `${formatEther(comision)} ETH`);
  titulo('Saldos');
  dato('Custodio antes', `${antes.custodio} ETH`);
  dato('Custodio después', `${await saldoEnEth(llave.address)} ETH`);
  dato('Destino antes', `${antes.destino} ETH`);
  dato('Destino después', `${await saldoEnEth(solicitud.destino)} ETH`);
  dato('Próximo nonce', await cadena.getTransactionCount({ address: llave.address }));
  listo('Retiro confirmado en la cadena local.');
} catch (error) {
  terminar(error);
}
