// Paso 5 · Un depósito: alguien envía fondos a la dirección del custodio.
import { parseEther } from 'viem';
import { cadena, exigirCadena, grifo, saldoEnEth } from '../lib/cadena.mjs';
import { llaveCaliente } from '../lib/estado.mjs';
import { dato, listo, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirCadena();
  const { address } = llaveCaliente();
  const antes = await saldoEnEth(address);

  // Para RECIBIR no hace falta firmar nada: basta con que alguien conozca la dirección.
  const hash = await grifo.sendTransaction({ to: address, value: parseEther('10') });
  const recibo = await cadena.waitForTransactionReceipt({ hash });

  titulo('Depósito a la wallet del custodio');
  dato('Dirección', address);
  dato('Saldo antes', `${antes} ETH`);
  dato('Transacción', hash);
  dato('Incluida en el bloque', recibo.blockNumber);
  dato('Saldo después', `${await saldoEnEth(address)} ETH`);
  listo('El custodio tiene fondos. La llave no intervino para recibirlos.');
} catch (error) {
  terminar(error);
}
