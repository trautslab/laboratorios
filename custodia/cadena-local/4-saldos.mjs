// Paso 4 · Preguntar por saldos: la cadena responde por cualquier dirección, exista o no.
import { createPublicClient, formatEther, http } from 'viem';
import { anvil } from 'viem/chains';

const cadena = createPublicClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

const DIRECCIONES = [
  ['Cuenta de prueba 0', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
  ['Cuenta de prueba 1', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
  ['Una que nadie usó ', '0x000000000000000000000000000000000000dEaD'],
];

try {
  for (const [nombre, address] of DIRECCIONES) {
    const wei = await cadena.getBalance({ address }); // por dentro: eth_getBalance
    console.log(`${nombre}: ${wei} wei = ${formatEther(wei)} ETH`);
  }
  console.log('\n✔ El saldo no está en la cuenta: lo lleva la cadena, y se lo preguntas a ella.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
