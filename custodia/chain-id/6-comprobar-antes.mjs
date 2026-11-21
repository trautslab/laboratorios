// Paso 6 · Antes de firmar: el chain id sale de tu configuración y se compara con el del nodo.
import { createPublicClient, http, parseEther, parseGwei, parseTransaction } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// La lista de redes de quien firma: nombre, URL del nodo y el chain id que se espera ahí.
// Las dos apuntan al mismo puerto a propósito: así una de las dos URL lleva a la red equivocada.
const REDES = [
  { nombre: 'red-a', url: 'http://127.0.0.1:8545', chainId: 31337 },
  { nombre: 'red-b', url: 'http://127.0.0.1:8545', chainId: 1337 },
];
// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

try {
  for (const red of REDES) {
    const nodo = createPublicClient({ transport: http(red.url) });
    const chainIdDelNodo = await nodo.getChainId();
    console.log(`Red configurada: ${red.nombre}, chain id ${red.chainId}`);
    console.log(`  El nodo de su URL responde: chain id ${chainIdDelNodo}`);
    if (chainIdDelNodo !== red.chainId) {
      console.log('  No coinciden: no se firma.\n');
      continue;
    }
    // El chain id que se firma es el de la configuración, nunca el que acaba de decir el nodo.
    const nonce = await nodo.getTransactionCount({ address: cuenta.address });
    const firmada = await cuenta.signTransaction({ chainId: red.chainId, nonce, to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', value: parseEther('1'), gas: 21000n, maxFeePerGas: parseGwei('2'), maxPriorityFeePerGas: parseGwei('1') });
    console.log('  Coinciden: se firma.');
    console.log(`  Dentro de lo firmado: chain id ${parseTransaction(firmada).chainId}, nonce ${nonce}\n`);
  }
  console.log('✔ La comprobación detuvo la firma para la red cuya URL llevaba a otra cadena.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil --chain-id 1337');
  process.exit(1);
}
