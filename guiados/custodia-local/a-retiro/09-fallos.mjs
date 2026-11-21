// Paso 9 · Probar que los controles frenan lo que deben frenar.
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { CLIENTE_ANA, CLIENTE_LUIS, DESCONOCIDO } from '../lib/config.mjs';
import { retirar } from '../lib/custodio.mjs';
import { leer, llaveCaliente } from '../lib/estado.mjs';
import { contador, deshabilitarLlave, habilitarLlave } from '../lib/llavero.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirCadena();
  const llave = llaveCaliente();
  const saldoInicial = await saldoEnEth(llave.address);

  titulo('Caso 1 · Monto sobre el límite (5 ETH a Ana)');
  let r = await retirar(llave, { destino: CLIENTE_ANA, montoEth: '5' });
  dato('Decisión', `${r.decision} (${r.regla})`);
  dato('Firmas pedidas a KMS', contador.firmas);

  titulo('Caso 2 · Destino que nadie dio de alta (0.5 ETH)');
  r = await retirar(llave, { destino: DESCONOCIDO, montoEth: '0.5' });
  dato('Decisión', `${r.decision} (${r.regla})`);
  dato('Firmas pedidas a KMS', contador.firmas);
  nota('La política corta antes del llavero: sin aprobación no existe firma.');

  titulo('Caso 3 · Reenviar el retiro del paso 8 (repetición)');
  const anterior = leer('retiro-firmado.json', null);
  if (!anterior) throw new Error('Corre antes los pasos 7 y 8.');
  try {
    await cadena.sendRawTransaction({ serializedTransaction: anterior.cruda });
    dato('Resultado', 'ACEPTADA (no debería)');
  } catch (error) {
    dato('El nodo responde', error.details ?? error.shortMessage);
    nota(`Esa firma lleva el nonce ${anterior.nonce}, que ya se usó: no se puede cobrar dos veces.`);
  }

  titulo('Caso 4 · Llave deshabilitada en KMS (0.5 ETH a Ana)');
  await deshabilitarLlave(llave.keyId);
  r = await retirar(llave, { destino: CLIENTE_ANA, montoEth: '0.5' });
  dato('Decisión de política', `${r.decision} (${r.regla})`);
  dato('¿Se firmó?', r.firmado ? 'sí' : `no · KMS respondió ${r.error}`);
  await habilitarLlave(llave.keyId);
  nota('Deshabilitar la llave es el freno de emergencia: nada sale mientras esté así.');

  titulo('Caso 5 · Con la llave habilitada otra vez (0.25 ETH a Luis)');
  r = await retirar(llave, { destino: CLIENTE_LUIS, montoEth: '0.25' });
  dato('Decisión', `${r.decision} (${r.regla})`);
  dato('Estado en cadena', r.recibo.status);
  dato('Bloque', r.recibo.blockNumber);

  titulo('Resumen');
  dato('Saldo al empezar', `${saldoInicial} ETH`);
  dato('Saldo al terminar', `${await saldoEnEth(llave.address)} ETH`);
  dato('Firmas pedidas a KMS', `${contador.firmas} (una rechazada por KMS, una entregada)`);
  listo('De cinco intentos salió uno: el único que cumplía todo.');
} catch (error) {
  terminar(error);
}
