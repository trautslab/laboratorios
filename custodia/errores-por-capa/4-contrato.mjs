// Paso 4 (preparación) · Pone en la cadena el contrato de prueba Caja. Es un script ya hecho:
// cómo se sube un contrato se explica en el laboratorio 19 de la ruta.
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { artefacto } from '../lib/compilar.mjs';

// Llave PÚBLICA de la cuenta de prueba 9 de Anvil. Solo sube la Caja: así su primer contrato
// queda siempre en la misma dirección.
const cuenta = privateKeyToAccount('0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6');
const CAJA = '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35';

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte, pollingInterval: 100 });
const billetera = createWalletClient({ account: cuenta, chain: anvil, transport: transporte });

try {
  // Si ya está (corriste este script antes), no la sube otra vez.
  if (!(await cadena.getCode({ address: CAJA }))) {
    const { abi, bytecode } = artefacto('errores-por-capa', 'Caja');
    const hash = await billetera.deployContract({ abi, bytecode });
    await cadena.waitForTransactionReceipt({ hash });
  }
  const codigo = await cadena.getCode({ address: CAJA });
  if (!codigo) throw new Error('La cuenta de prueba 9 ya se usó en esta cadena. Reinicia Anvil y repite.');
  console.log(`Contrato Caja en ${CAJA}`);
  console.log(`Código en esa dirección: ${(codigo.length - 2) / 2} bytes`);
  console.log('\n✔ La Caja está en la cadena. Su función retirar(monto) revierte si el total pasa de 100.');
} catch (error) {
  console.error(`✖ No se pudo preparar el contrato: ${error.shortMessage ?? error.message}`);
  console.error('  Si no hay cadena en http://127.0.0.1:8545, abre otra terminal y corre: npx anvil');
  process.exit(1);
}
