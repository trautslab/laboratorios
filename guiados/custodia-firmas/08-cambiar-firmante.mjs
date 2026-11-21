// Paso 8 · Cambiar quién firma: una transacción en la multifirma, una rotación en MPC.
import { encodeFunctionData, keccak256, toHex } from 'viem';
import { cadena, dato, exigir, exigirCadena, guardar, leer, listo, nota, PERSONAS, terminar, titulo } from './lib/comun.mjs';
import { ejecutar, multifirma } from './lib/multifirma.mjs';
import { aTexto, deTexto, direccionDe, firmarEntre, rotar } from './lib/mpc.mjs';

try {
  await exigirCadena();

  // Multifirma: Elena sale y entra Mallory (que ahora hace de persona nueva del equipo).
  // El cambio es una llamada del contrato a sí mismo, así que pide dos firmas como cualquier retiro.
  const { address, abi } = multifirma();
  const datos = encodeFunctionData({ abi, functionName: 'cambiarDueno', args: [PERSONAS.Elena.address, PERSONAS.Mallory.address] });
  const { recibo } = await ejecutar({ destino: address, valor: 0n, datos, firmantes: ['Carla', 'Diego'] });
  titulo('Multifirma: reemplazar a un dueño');
  dato('Gas usado', recibo.gasUsed);
  dato('Dirección de la multifirma', `${address} (la misma)`);
  dato('duenos(2) ahora', `${await cadena.readContract({ address, abi, functionName: 'duenos', args: [2n] })}`);
  dato('¿Elena sigue siendo dueña?', (await cadena.readContract({ address, abi, functionName: 'esDueno', args: [PERSONAS.Elena.address] })) ? 'sí' : 'no');
  nota('El cambio queda registrado en la cadena, a la vista de cualquiera.');

  // MPC: las tres partes se renuevan. La dirección no cambia y las partes viejas dejan de servir.
  const mpc = exigir(leer('mpc.json'), 'Falta la llave MPC. Corre antes: node 04-generar-llave-mpc.mjs');
  const viejas = ['Carla', 'Diego', 'Elena'].map((nombre) => deTexto(mpc.partes[nombre]));
  const { partes: nuevas, mensajes } = rotar(viejas);
  const hash = keccak256(toHex('firma de prueba tras rotar'));
  await firmarEntre([nuevas[0], nuevas[1]], hash, mpc.address);
  let mezcla = 'FIRMÓ (no debería)';
  try {
    await firmarEntre([deTexto(mpc.partes.Carla), nuevas[1]], hash, mpc.address);
  } catch (error) {
    mezcla = `no hay firma · «${error.message ?? error}»`;
  }
  guardar('mpc.json', { address: mpc.address, partes: { Carla: aTexto(nuevas[0]), Diego: aTexto(nuevas[1]), Elena: aTexto(nuevas[2]) } });

  titulo('MPC: rotar las partes');
  dato('Mensajes intercambiados', mensajes);
  dato('Dirección después de rotar', `${direccionDe(nuevas[0])} (${direccionDe(nuevas[0]) === mpc.address ? 'la misma' : 'CAMBIÓ'})`);
  dato('Dos partes nuevas', 'firman juntas');
  dato('Parte vieja + parte nueva', mezcla);
  dato('Transacciones en la cadena', '0');
  nota('Una parte copiada antes de rotar ya no combina con las nuevas. La cadena no se enteró de nada.');
  listo('Dos cambios distintos: uno público y con gas, otro privado y sin tocar la cadena.');
} catch (error) {
  terminar(error);
}
