// Paso 4 · MPC: tres partes generan UNA llave sin que ninguna la tenga entera.
import { parseEther } from 'viem';
import { cadena, dato, DUENOS, exigirCadena, grifo, guardar, listo, nota, saldoEnEth, terminar, titulo } from './lib/comun.mjs';
import { aTexto, direccionDe, generarLlave } from './lib/mpc.mjs';

try {
  await exigirCadena();
  const { partes, mensajes } = generarLlave(3, 2);
  const address = direccionDe(partes[0]);

  // Cada persona guarda SU parte. En la vida real, cada una en su propio dispositivo.
  const guardadas = Object.fromEntries(DUENOS.map((nombre, i) => [nombre, aTexto(partes[i])]));
  guardar('mpc.json', { address, partes: guardadas });
  await cadena.waitForTransactionReceipt({ hash: await grifo.sendTransaction({ to: address, value: parseEther('5') }) });

  titulo('Generación distribuida de la llave (2 de 3)');
  dato('Mensajes intercambiados', `${mensajes}, en 4 rondas`);
  for (const [i, nombre] of DUENOS.entries()) dato(`Parte de ${nombre}`, `${Math.round(partes[i].toBytes().length / 1024)} KiB, guardada en .estado/mpc.json`);
  dato('¿Misma llave pública?', partes.every((p) => direccionDe(p) === address) ? 'sí' : 'NO');
  dato('Dirección', address);
  dato('Saldo', `${await saldoEnEth(address)} ETH`);
  dato('¿Hay código ahí?', (await cadena.getCode({ address })) ? 'sí' : 'no: es una cuenta común');
  nota('El protocolo nunca arma la llave privada completa, ni siquiera al crearla.');
  nota('Aquí las tres partes corren en tu máquina; en la vida real, cada una en un equipo distinto.');
  listo('Una dirección normal, controlada por tres partes.');
} catch (error) {
  terminar(error);
}
