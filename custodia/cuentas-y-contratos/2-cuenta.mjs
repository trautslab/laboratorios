// Paso 2 · Lo que la cadena guarda de una dirección: saldo, nonce y código.
import { createPublicClient, formatEther, http, size } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });
const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // la cuenta de prueba 0 de Anvil

try {
  const saldo = await cadena.getBalance({ address }); // por dentro: eth_getBalance
  const nonce = await cadena.getTransactionCount({ address }); // por dentro: eth_getTransactionCount
  // viem devuelve undefined cuando no hay código. El nodo envía «0x»: cero bytes.
  const codigo = (await cadena.getCode({ address })) ?? '0x'; // por dentro: eth_getCode

  console.log(`Cuenta de prueba 0: ${address}\n`);
  console.log(`Saldo:  ${saldo} wei = ${formatEther(saldo)} ETH`);
  console.log(`Nonce:  ${nonce}`);
  console.log(`Código: ${codigo} (${size(codigo)} bytes)`);
  console.log('\n✔ Tres datos por dirección. Esta tiene saldo, no envió nada y no tiene código.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
