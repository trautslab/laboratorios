// Paso 2 · Firmar una transferencia sin enviarla y leer el chain id que quedó dentro.
import { formatEther, getAddress, parseEther, parseGwei, parseTransaction } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// La transferencia completa: 1 ETH a la cuenta de prueba 1. El primer campo dice para qué red es.
const transferencia = {
  chainId: 31337,
  nonce: 0,
  to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  value: parseEther('1'),
  gas: 21000n,
  maxFeePerGas: parseGwei('2'),
  maxPriorityFeePerGas: parseGwei('1'),
};

// Firmar es un cálculo local: aquí no se habla con ninguna red y no se envía nada.
const firmada = await cuenta.signTransaction(transferencia);
console.log(`Firmada para el chain id ${transferencia.chainId} (${(firmada.length - 2) / 2} bytes):`);
console.log(firmada);

// Cualquiera que reciba esos bytes puede leer los campos, también el chain id.
const leida = parseTransaction(firmada);
console.log('\nLeída de vuelta desde esos bytes:');
console.log(`  chain id: ${leida.chainId}`);
console.log(`  nonce:    ${leida.nonce}`);
console.log(`  para:     ${getAddress(leida.to)}`);
console.log(`  valor:    ${formatEther(leida.value)} ETH`);
console.log('\n✔ El chain id es un campo de lo que se firmó. Este script no habló con ninguna red.');
