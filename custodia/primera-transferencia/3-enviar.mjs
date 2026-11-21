// Paso 3 · Enviar 1 ETH: la librería arma el mensaje, lo firma con la llave y lo entrega al nodo.
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Nunca la uses en una red real.
const cuenta = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const DESTINO = '0x40596E1B9B0032595240d85AC2Cf9e6b83041399'; // una dirección que nadie usó en esta cadena

const billetera = createWalletClient({ account: cuenta, chain: anvil, transport: http('http://127.0.0.1:8545') });

try {
  const hash = await billetera.sendTransaction({
    to: DESTINO,
    value: parseEther('1'),
    // Tope de comisión, fijado a mano para que el hash salga igual en Node, en Rust y en tu máquina.
    // Sin estas dos líneas la librería elige el tope por ti. Qué significan: laboratorio «Gas y comisión».
    maxFeePerGas: 2_000_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
  }); // por dentro: firma en tu máquina y eth_sendRawTransaction
  console.log(`De:    ${cuenta.address}`);
  console.log(`Para:  ${DESTINO}`);
  console.log('Valor: 1 ETH');
  console.log(`\nHash:  ${hash}`);
  console.log('\n✔ El nodo aceptó el mensaje firmado y devolvió su hash. Guárdalo: con él se pide el recibo.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
