// Paso 4 · Un contrato es una cuenta con código: la cadena le guarda los mismos tres datos.
import { createPublicClient, createWalletClient, formatEther, getAddress, http, parseEther, size } from 'viem';
import { anvil } from 'viem/chains';
import { artefacto } from '../lib/compilar.mjs';

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const CREADOR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // la cuenta de prueba 1 de Anvil
// El contrato ya compilado con: node lib/compilar.mjs cuentas-y-contratos
const { abi, bytecode } = artefacto('cuentas-y-contratos', 'Alcancia');

try {
  console.log(`Antes:   la cuenta de prueba 1 tiene nonce ${await cadena.getTransactionCount({ address: CREADOR })}`);

  // Poner el contrato en la cadena (código ya hecho: el despliegue se explica en el laboratorio
  // de contratos). La cuenta de prueba 1 envía una transacción con el código y 1 ETH; Anvil la firma.
  const creador = createWalletClient({ account: CREADOR, chain: anvil, transport: transporte });
  const hash = await creador.deployContract({ abi, bytecode, value: parseEther('1') });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  const address = getAddress(recibo.contractAddress); // la misma dirección, con mayúsculas de control
  console.log(`Contrato creado en ${address}`);
  console.log(`Después: la cuenta de prueba 1 tiene nonce ${await cadena.getTransactionCount({ address: CREADOR })}\n`);

  // Las mismas tres preguntas del paso 2, ahora sobre la dirección del contrato.
  const saldo = await cadena.getBalance({ address }); // por dentro: eth_getBalance
  const nonce = await cadena.getTransactionCount({ address }); // por dentro: eth_getTransactionCount
  const codigo = (await cadena.getCode({ address })) ?? '0x'; // por dentro: eth_getCode
  console.log(`Saldo:  ${saldo} wei = ${formatEther(saldo)} ETH`);
  console.log(`Nonce:  ${nonce}`);
  console.log(`Código: ${codigo.slice(0, 22)}… (${size(codigo)} bytes)`);
  console.log('\n✔ Un contrato tiene saldo y nonce como cualquier cuenta. Lo que lo distingue es el código.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
