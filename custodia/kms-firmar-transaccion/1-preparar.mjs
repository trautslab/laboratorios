// Paso 1 · Preparar la llave en KMS, calcular su dirección y darle ETH de prueba.
import { CreateAliasCommand, CreateKeyCommand, DescribeKeyCommand, GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { createPublicClient, createWalletClient, formatEther, getAddress, http, keccak256, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

const KMS = 'http://localhost:4566';
const NODO = 'http://127.0.0.1:8545';
const ALIAS = 'alias/ruta-kms-firmar-transaccion';
// Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
const salir = (mensaje) => { console.error(mensaje); process.exit(1); };

// La llave se busca por su alias. Solo si no existe se crea: correr esto dos veces no crea dos llaves.
let llave;
let origen = 'ya existía';
try {
  llave = (await kms.send(new DescribeKeyCommand({ KeyId: ALIAS }))).KeyMetadata;
} catch (error) {
  if (error.name !== 'NotFoundException') salir(`✖ No hay KMS en ${KMS}. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0`);
  llave = (await kms.send(new CreateKeyCommand({ KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY' }))).KeyMetadata;
  await kms.send(new CreateAliasCommand({ AliasName: ALIAS, TargetKeyId: llave.KeyId }));
  origen = 'creada ahora';
}

// La dirección sale de la llave pública: los últimos 20 bytes de keccak256 de sus coordenadas X e Y.
const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
const direccion = getAddress(`0x${keccak256(PublicKey.slice(-64)).slice(-40)}`);
console.log(`Alias:   ${ALIAS}`);
console.log(`≈ Llave: ${llave.KeyId} (${origen})`);
console.log(`Tipo:    ${llave.KeySpec}, uso ${llave.KeyUsage}`);
console.log(`≈ Dirección: ${direccion}`);

try {
  const red = createPublicClient({ chain: anvil, transport: http(NODO) });
  // La cuenta de prueba 0 de Anvil (su llave es pública) le envía 1 ETH, solo si todavía no tiene.
  if ((await red.getBalance({ address: direccion })) === 0n) {
    const cuenta0 = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    const hash = await createWalletClient({ account: cuenta0, chain: anvil, transport: http(NODO) }).sendTransaction({ to: direccion, value: parseEther('1') });
    await red.waitForTransactionReceipt({ hash });
  }
  console.log(`\nSaldo de esa dirección: ${formatEther(await red.getBalance({ address: direccion }))} ETH`);
  console.log(`Nonce de esa dirección: ${await red.getTransactionCount({ address: direccion })}`);
  console.log('\n✔ La llave está en KMS, su dirección tiene ETH de prueba y todavía no envió nada.');
} catch {
  salir(`✖ No hay cadena en ${NODO}. Abre otra terminal y corre: npx anvil`);
}
