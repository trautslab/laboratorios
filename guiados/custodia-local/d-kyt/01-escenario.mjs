// Paso 1 · Preparar el escenario: una historia de pagos en la cadena local.
import { createWalletClient, http, parseEther } from 'viem';
import { cadena, exigirCadena, grifo } from '../lib/cadena.mjs';
import { CHAIN, RPC_URL } from '../lib/config.mjs';
import { guardar, leer } from '../lib/estado.mjs';
import { cuentaDe, direccionDe } from '../lib/kyt.mjs';
import { crearLlave, direccionDesde, exigirLlavero, llavePublica } from '../lib/llavero.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

const pagar = async (de, a, montoEth) => {
  const wallet = de === 'Grifo' ? grifo : createWalletClient({ chain: CHAIN, transport: http(RPC_URL), account: cuentaDe(de) });
  const hash = await wallet.sendTransaction({ to: direccionDe(a), value: parseEther(montoEth) });
  await cadena.waitForTransactionReceipt({ hash });
  dato(`${de} → ${a}`, `${montoEth} ETH`);
};

try {
  await exigirCadena();
  await exigirLlavero();

  titulo('Historia de pagos (todo ficticio, en tu cadena local)');
  await pagar('Grifo', 'Mezclador', '20'); // el mezclador está en la lista de vigilancia
  await pagar('Grifo', 'Empresa', '40'); // una empresa sin relación con el mezclador
  await pagar('Mezclador', 'Mula', '12'); // la mula recibe todo del mezclador
  await pagar('Empresa', 'Ana', '8'); // sueldo de Ana: limpio
  await pagar('Empresa', 'Beto', '9.5');
  await pagar('Mula', 'Beto', '0.5'); // Beto: 5 % de lo que recibió pasó por la mula
  await pagar('Empresa', 'Dana', '7');
  await pagar('Mula', 'Dana', '3'); // Dana: 30 %
  await pagar('Empresa', 'Rita', '2');
  await pagar('Mula', 'Rita', '6'); // Rita: 75 %

  // La wallet del custodio (llave en KMS) con fondos propios para atender retiros.
  const { KeyId } = await crearLlave('Wallet del custodio (laboratorio KYT)');
  const custodio = { keyId: KeyId, address: direccionDesde((await llavePublica(KeyId)).xy) };
  guardar('llaves.json', { ...leer('llaves.json'), kyt: custodio });
  const hash = await grifo.sendTransaction({ to: custodio.address, value: parseEther('10') });
  await cadena.waitForTransactionReceipt({ hash });

  titulo('Wallet del custodio');
  dato('Dirección', custodio.address);
  dato('Saldo', '10 ETH');
  nota('Nadie en esta historia tiene «sucio» escrito en la frente: solo hay transferencias.');
  listo(`Escenario listo en el bloque ${await cadena.getBlockNumber()}.`);
} catch (error) {
  terminar(error);
}
