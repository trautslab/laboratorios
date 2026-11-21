// Pasos 1 y 3 · La misma llave en la red que esté escuchando en el puerto 8545.
import { createPublicClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const LLAVE = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const red = createPublicClient({ transport: http('http://127.0.0.1:8545') });

try {
  // La dirección se calcula a partir de la llave: en esta línea no interviene ninguna red.
  const cuenta = privateKeyToAccount(LLAVE);
  // Lo demás se le pregunta a la red: quién es, y qué sabe de esa dirección.
  const chainId = await red.getChainId();
  const saldo = await red.getBalance({ address: cuenta.address });
  const nonce = await red.getTransactionCount({ address: cuenta.address });
  console.log(`Red:       chain id ${chainId}`);
  console.log(`Dirección: ${cuenta.address}`);
  console.log(`Saldo:     ${formatEther(saldo)} ETH`);
  console.log(`Nonce:     ${nonce}`);
  console.log('\n✔ La dirección sale de la llave. El chain id, el saldo y el nonce los responde cada red.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
