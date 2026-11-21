// Paso 7 · Construir el retiro y pedirle la firma al llavero.
// Uso: node a-retiro/07-firmar.mjs <destino> <monto en ETH>
import { bytesToHex, formatEther, formatGwei, recoverAddress } from 'viem';
import { exigirCadena } from '../lib/cadena.mjs';
import { CLIENTE_ANA } from '../lib/config.mjs';
import { construirRetiro, firmarRetiro, hashParaFirmar } from '../lib/custodio.mjs';
import { guardar, llaveCaliente } from '../lib/estado.mjs';
import { evaluar } from '../lib/politica.mjs';
import { corto, dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

try {
  await exigirCadena();
  const llave = llaveCaliente();
  const solicitud = { destino: process.argv[2] ?? CLIENTE_ANA, montoEth: process.argv[3] ?? '0.5' };

  const veredicto = evaluar(solicitud);
  if (veredicto.decision !== 'APROBAR') throw new Error(`La política rechazó el retiro (${veredicto.regla}). No se firma.`);

  const tx = await construirRetiro(llave.address, solicitud);
  titulo('Transacción sin firmar');
  dato('chainId', tx.chainId);
  dato('nonce', tx.nonce);
  dato('to', tx.to);
  dato('value', `${tx.value} wei (${formatEther(tx.value)} ETH)`);
  dato('gas', tx.gas);
  dato('maxFeePerGas', `${formatGwei(tx.maxFeePerGas)} gwei`);

  const hash = hashParaFirmar(tx);
  titulo('Lo que viaja al llavero');
  dato('Hash a firmar', hash);
  nota('KMS recibe solo estos 32 bytes. No ve el destino ni el monto.');

  const { firma, cruda, hash: hashTx } = await firmarRetiro(llave, tx);
  titulo('Lo que devuelve el llavero');
  dato('Firma (DER)', `${firma.der.length} bytes  ${corto(bytesToHex(firma.der), 14, 8)}`);
  dato('r', corto(firma.r, 14, 8));
  dato('s', `${corto(firma.s, 14, 8)}${firma.sOriginalAlta ? '  (venía alta: se usó N − s)' : '  (ya era baja)'}`);
  dato('yParity', firma.yParity);

  titulo('Comprobación sin tocar la cadena');
  const recuperada = await recoverAddress({ hash, signature: firma });
  dato('Dirección recuperada', recuperada);
  dato('Dirección del custodio', llave.address);
  dato('¿Coinciden?', recuperada === llave.address ? 'sí' : 'NO');

  guardar('retiro-firmado.json', { solicitud, nonce: tx.nonce, cruda, hash: hashTx });
  titulo('Transacción firmada');
  dato('Tamaño', `${(cruda.length - 2) / 2} bytes`);
  dato('Hash de la transacción', hashTx);
  listo('Firmada y guardada en .estado/retiro-firmado.json. Todavía no se envió.');
} catch (error) {
  terminar(error);
}
