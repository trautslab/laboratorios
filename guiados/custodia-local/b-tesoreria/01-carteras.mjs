// Paso 1 · Crear las carteras: una dirección de depósito por cliente, una hot y una warm.
import { parseEther } from 'viem';
import { cadena, exigirCadena, grifo } from '../lib/cadena.mjs';
import { guardar, leer } from '../lib/estado.mjs';
import { crearLlave, direccionDesde, exigirLlavero, llavePublica } from '../lib/llavero.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

async function nuevaCartera(descripcion) {
  const { KeyId } = await crearLlave(descripcion);
  const { xy } = await llavePublica(KeyId);
  return { keyId: KeyId, address: direccionDesde(xy) };
}

try {
  await exigirCadena();
  await exigirLlavero();
  const tesoreria = {
    depositos: { Ana: await nuevaCartera('Depósitos de Ana'), Luis: await nuevaCartera('Depósitos de Luis') },
    hot: await nuevaCartera('Wallet hot: atiende retiros'),
    warm: await nuevaCartera('Wallet warm: guarda el grueso'),
  };
  guardar('llaves.json', { ...leer('llaves.json'), tesoreria });

  // Capital propio del custodio: 1 ETH en la hot para pagar comisiones de red.
  const hash = await grifo.sendTransaction({ to: tesoreria.hot.address, value: parseEther('1') });
  await cadena.waitForTransactionReceipt({ hash });
  guardar('cuentas.json', { comisionesWei: '0', capitalPropioWei: parseEther('1').toString() });

  titulo('Carteras de la tesorería (cada llave vive en KMS)');
  dato('Depósitos de Ana', tesoreria.depositos.Ana.address);
  dato('Depósitos de Luis', tesoreria.depositos.Luis.address);
  dato('Hot', tesoreria.hot.address);
  dato('Warm', tesoreria.warm.address);
  nota('Cuatro llaves distintas: comprometer una no compromete a las demás.');
  nota('La hot arranca con 1 ETH del propio custodio para pagar comisiones.');
  listo('Cuatro carteras listas.');
} catch (error) {
  terminar(error);
}
