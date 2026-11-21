// Paso 5 · Quien tiene la frase exporta la llave pública extendida del nivel de cuenta.
import { bytesToHex } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE = 'test test test test test test test test test test test junk';

console.log("El camino de una dirección, m/44'/60'/0'/0/3, tiene dos tipos de paso:");
console.log("  44'  60'  0'   con apóstrofo: la hija se calcula con la llave PRIVADA del padre");
console.log('  0    3         sin apóstrofo: la hija se calcula con la llave PÚBLICA del padre\n');

// El nivel de cuenta es el último con apóstrofo. Para llegar hasta él hace falta la frase.
const cuenta = HDKey.fromMasterSeed(mnemonicToSeedSync(FRASE)).derive("m/44'/60'/0'");
console.log("Llave pública extendida de m/44'/60'/0':");
console.log(`  ${cuenta.publicExtendedKey}`);
console.log('Lleva dos datos, ninguno secreto:');
console.log(`  llave pública    0x${bytesToHex(cuenta.publicKey)}`);
console.log(`  código de cadena 0x${bytesToHex(cuenta.chainCode)}`);
console.log('\n✔ Ese texto se puede copiar a otro sistema: no contiene la frase ni ninguna llave privada.');
