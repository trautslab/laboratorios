// Paso 6 · La regla completa: texto → entero al entrar, enteros en el medio, texto al salir.
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { anvil } from 'viem/chains';

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const cartera = createWalletClient({ chain: anvil, transport: transporte });
const ORIGEN = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // cuenta de prueba 0: Anvil firma por ella
const DESTINO = '0x1111111111111111111111111111111111111111';

try {
  const antes = await cadena.getBalance({ address: DESTINO });

  // 1. Al entrar: dos montos escritos por una persona pasan a enteros.
  const pagos = ['0.1', '0.2'].map((texto) => parseEther(texto));
  // 2. En el medio: se suma en enteros.
  const total = pagos[0] + pagos[1];
  console.log('Entrada:            "0.1" ETH y "0.2" ETH');
  console.log(`En enteros:         ${pagos[0]} + ${pagos[1]} = ${total} wei`);

  const hash = await cartera.sendTransaction({ account: ORIGEN, to: DESTINO, value: total });
  await cadena.waitForTransactionReceipt({ hash });

  // Lo que quedó escrito en la cadena: el mismo entero, en hexadecimal.
  const tx = await cadena.request({ method: 'eth_getTransactionByHash', params: [hash] });
  console.log(`En la transacción:  "${tx.value}" = ${BigInt(tx.value)} wei`);
  const recibido = (await cadena.getBalance({ address: DESTINO })) - antes;
  console.log(`El destino recibió: ${recibido} wei`);
  // 3. Al salir: el entero se formatea solo para mostrarlo.
  console.log(`Para mostrar:       ${formatEther(recibido)} ETH`);
  console.log('\n✔ 0.1 + 0.2 da 0.3 exacto: se sumó en wei y los decimales aparecieron al final.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
