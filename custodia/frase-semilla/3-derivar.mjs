// Paso 3 · De la semilla sale un árbol de llaves. Un camino nombra una llave del árbol.
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { createWalletClient, http, toHex } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE = 'test test test test test test test test test test test junk';
const cadena = createWalletClient({ chain: anvil, transport: http('http://127.0.0.1:8545') });

try {
  const deAnvil = await cadena.getAddresses(); // por dentro: eth_accounts, las cuentas que Anvil derivó al arrancar
  const enAnvil = (direccion) => (deAnvil.includes(direccion) ? `es la cuenta (${deAnvil.indexOf(direccion)}) de Anvil` : 'no es una cuenta de Anvil');

  // Frase → semilla → raíz del árbol (m). Desde la raíz, cada camino lleva a una llave.
  const raiz = HDKey.fromMasterSeed(mnemonicToSeedSync(FRASE));
  for (const i of [0, 1, 2]) {
    const camino = `m/44'/60'/0'/0/${i}`;
    const llave = toHex(raiz.derive(camino).privateKey);
    const direccion = privateKeyToAccount(llave).address;
    console.log(`${camino}\n  llave privada ${llave}\n  dirección     ${direccion}\n  ${enAnvil(direccion)}`);
  }

  // Las librerías de Ethereum hacen frase → semilla → camino en una llamada.
  const novena = mnemonicToAccount(FRASE, { addressIndex: 9 }).address;
  console.log(`\nEn una llamada, el índice 9: ${novena}\n  ${enAnvil(novena)}`);

  // El árbol no termina en lo que Anvil muestra: cambia un número del camino y hay otra llave.
  const otra = mnemonicToAccount(FRASE, { path: "m/44'/60'/1'/0/0" }).address;
  console.log(`\nOtra rama, m/44'/60'/1'/0/0: ${otra}\n  ${enAnvil(otra)}`);
  console.log('\n✔ Con la frase y el camino se recupera cada llave. Anvil no guarda nada más que eso.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
