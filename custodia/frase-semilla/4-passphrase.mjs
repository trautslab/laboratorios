// Paso 4 · La misma frase con una passphrase da otra semilla y, con ella, otro árbol entero.
import { bytesToHex } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE = 'test test test test test test test test test test test junk';
const CAMINO = "m/44'/60'/0'/0/0";

console.log(`La misma frase y el mismo camino, ${CAMINO}. Solo cambia la passphrase.\n`);
for (const passphrase of ['', 'custodia', 'Custodia']) {
  // La passphrase entra en la sal de PBKDF2: «mnemonic» + passphrase. Vacía es lo normal.
  const semilla = mnemonicToSeedSync(FRASE, passphrase);
  const llave = HDKey.fromMasterSeed(semilla).derive(CAMINO).privateKey;
  console.log(passphrase === '' ? 'Sin passphrase' : `Passphrase «${passphrase}»`);
  console.log(`  semilla   0x${bytesToHex(semilla.slice(0, 8))}… (primeros 8 de 64 bytes)`);
  console.log(`  dirección ${privateKeyToAccount(toHex(llave)).address}`);
}
console.log('\nNinguna fue rechazada: toda passphrase es válida y lleva a un árbol distinto.');
console.log('\n✔ Las mismas 12 palabras con otra passphrase dan otras direcciones, sin ningún aviso.');
