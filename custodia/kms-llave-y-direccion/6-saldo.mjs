// Paso 6 · La dirección que sale del KMS es una cuenta como cualquier otra: recibe y tiene saldo.
import { GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';
import { anvil } from 'viem/chains';

// Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
const kms = new KMSClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ALIAS = 'alias/ruta-kms-llave-y-direccion';
const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const CUENTA_DE_PRUEBA = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // la cuenta 0 de Anvil

let address;
try {
  const { PublicKey: der } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  address = publicKeyToAddress(`0x${Buffer.from(der.subarray(-65)).toString('hex')}`);
} catch {
  console.error(`✖ El KMS no respondió por ${ALIAS}. Revisa que el emulador esté corriendo y corre antes el paso 1.`);
  process.exit(1);
}

try {
  console.log(`≈ Dirección del custodio: ${address}`);
  console.log(`Saldo antes: ${formatEther(await cadena.getBalance({ address }))} ETH`);

  // Para recibir no se le pide nada al KMS: quien envía solo necesita conocer la dirección.
  // Envía la cuenta de prueba 0, y Anvil firma por ella.
  const remitente = createWalletClient({ account: CUENTA_DE_PRUEBA, chain: anvil, transport: transporte });
  const hash = await remitente.sendTransaction({ to: address, value: parseEther('1') });
  await cadena.waitForTransactionReceipt({ hash });
  console.log('La cuenta de prueba 0 de Anvil le envía 1 ETH');
  console.log(`≈ Transacción: ${hash}`);

  console.log(`Saldo después: ${formatEther(await cadena.getBalance({ address }))} ETH`);
  console.log(`Transacciones enviadas desde esa dirección: ${await cadena.getTransactionCount({ address })}`);
  console.log('\n✔ La cadena lleva un saldo para esa dirección. Para moverlo hará falta una firma del KMS.');
} catch {
  console.error('✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil');
  process.exit(1);
}
