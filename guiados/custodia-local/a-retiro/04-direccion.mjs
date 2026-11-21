// Paso 4 · De la llave pública a la dirección de Ethereum.
import { bytesToHex, keccak256 } from 'viem';
import { guardar, leer } from '../lib/estado.mjs';
import { direccionDesde, llavePublica } from '../lib/llavero.mjs';
import { corto, dato, listo, terminar, titulo } from '../lib/salida.mjs';

try {
  const llaves = leer('llaves.json');
  const keyId = llaves.llaveCaliente?.keyId;
  if (!keyId) throw new Error('Falta la llave. Corre antes: node a-retiro/03-crear-llave.mjs');

  const { der, punto, xy } = await llavePublica(keyId);
  const address = direccionDesde(xy);
  guardar('llaves.json', { ...llaves, llaveCaliente: { keyId, address } });

  titulo('De llave pública a dirección');
  dato('1. KMS entrega (DER)', `${der.length} bytes  ${corto(bytesToHex(der), 14, 8)}`);
  dato('2. Punto de la curva', `${punto.length} bytes  04 + X + Y`);
  dato('   X', corto(bytesToHex(xy.slice(0, 32)), 14, 8));
  dato('   Y', corto(bytesToHex(xy.slice(32)), 14, 8));
  dato('3. keccak256(X || Y)', corto(keccak256(xy), 14, 8));
  dato('4. Últimos 20 bytes', address);
  listo(`Dirección del custodio: ${address}`);
} catch (error) {
  terminar(error);
}
