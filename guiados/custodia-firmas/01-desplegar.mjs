// Paso 1 · Compilar y desplegar la multifirma: las reglas quedan escritas en la cadena.
import { parseEther } from 'viem';
import { cadena, dato, DUENOS, exigirCadena, grifo, guardar, listo, nota, PERSONAS, saldoEnEth, terminar, titulo } from './lib/comun.mjs';
import { compilar } from './lib/multifirma.mjs';

try {
  await exigirCadena();
  const { abi, bytecode, version } = compilar();
  const duenos = DUENOS.map((nombre) => PERSONAS[nombre].address);

  // Desplegar es enviar una transacción sin destino, con el bytecode y los argumentos del constructor.
  const hash = await grifo.deployContract({ abi, bytecode, args: [duenos, 2n], value: parseEther('5') });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  guardar('multifirma.json', { address: recibo.contractAddress, abi });

  titulo('Multifirma desplegada');
  dato('Compilador', `solc ${version.split('+')[0]}`);
  dato('Tamaño del contrato', `${(bytecode.length - 2) / 2} bytes`);
  dato('Dirección', recibo.contractAddress);
  dato('Gas del despliegue', recibo.gasUsed);
  dato('Saldo', `${await saldoEnEth(recibo.contractAddress)} ETH`);
  titulo('Lo que cualquiera puede leer de la cadena');
  dato('umbral()', await cadena.readContract({ address: recibo.contractAddress, abi, functionName: 'umbral' }));
  for (const [i, nombre] of DUENOS.entries()) dato(`duenos(${i})`, `${await cadena.readContract({ address: recibo.contractAddress, abi, functionName: 'duenos', args: [BigInt(i)] })} · ${nombre}`);
  nota('Los fondos no están en la cuenta de una persona: están en el contrato.');
  listo('Las reglas (quiénes y cuántos) son públicas y las hace cumplir la cadena.');
} catch (error) {
  terminar(error);
}
