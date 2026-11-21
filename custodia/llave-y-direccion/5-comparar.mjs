// Paso 5 · Lo hecho a mano, contra la librería y contra la cadena. Y una llave nueva que ya recibe.
import { randomBytes } from 'node:crypto';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const NODO = 'http://127.0.0.1:8545';
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const hex = (bytes) => Buffer.from(bytes).toString('hex');

// Los pasos 2, 3 y 4 en una función: punto de la curva, Keccak-256, últimos 20 bytes, mayúsculas.
function direccionDe(llave) {
  const publica = secp256k1.getPublicKey(llave, false).slice(1);
  const minusculas = hex(keccak_256(publica).slice(-20));
  const hash = hex(keccak_256(Buffer.from(minusculas, 'ascii')));
  return `0x${[...minusculas].map((letra, i) => (parseInt(hash[i], 16) >= 8 ? letra.toUpperCase() : letra)).join('')}`;
}

const aMano = direccionDe(Buffer.from(LLAVE, 'hex'));
const cuenta = privateKeyToAccount(`0x${LLAVE}`); // la librería hace el mismo camino en una llamada
console.log(`A mano, pasos 2 a 4:      ${aMano}`);
console.log(`La librería, una llamada: ${cuenta.address}`);
console.log(`¿Iguales? ${aMano === cuenta.address ? 'sí' : 'no'}`);

const cadena = createPublicClient({ chain: anvil, transport: http(NODO) });
const billetera = createWalletClient({ account: cuenta, chain: anvil, transport: http(NODO) });
const saldoDe = async (address) => `${formatEther(await cadena.getBalance({ address }))} ETH`;

try {
  // La cadena nunca vio la llave. Solo conoce la dirección, y es la misma que calculaste.
  console.log(`\nLa cadena, por esa dirección: saldo ${await saldoDe(aMano)}`);

  // Una llave que no existía hace un instante. Su dirección se calcula igual, sin avisarle a nadie.
  const nueva = randomBytes(32);
  const direccionNueva = direccionDe(nueva);
  console.log('\nUna llave nueva, recién generada:');
  console.log(`≈ Llave nueva: 0x${hex(nueva)}`);
  console.log(`≈ Su dirección: ${direccionNueva}`);
  console.log(`Saldo antes:   ${await saldoDe(direccionNueva)} (la cadena responde aunque nadie registró esa dirección)`);
  const hash = await billetera.sendTransaction({ to: direccionNueva, value: parseEther('1') });
  await cadena.waitForTransactionReceipt({ hash });
  console.log('Le envío 1 ETH desde la cuenta de prueba.');
  console.log(`Saldo después: ${await saldoDe(direccionNueva)}`);
  console.log('\n✔ De la llave a la dirección hay tres cálculos locales y ningún registro: la dirección nueva ya recibió.');
} catch {
  console.error(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
  process.exit(1);
}
