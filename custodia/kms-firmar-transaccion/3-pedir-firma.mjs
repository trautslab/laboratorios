// Paso 3 · Enviar a KMS solo el hash y leer la firma DER que devuelve.
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { bytesToHex, hexToBytes, keccak256, parseEther, parseGwei, serializeTransaction } from 'viem';

const KMS = 'http://localhost:4566';
const ALIAS = 'alias/ruta-kms-firmar-transaccion';
// Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });

// La transacción del paso 2 y su hash.
const transaccion = { chainId: 31337, nonce: 0, maxPriorityFeePerGas: parseGwei('1'), maxFeePerGas: parseGwei('2'), gas: 21000n, to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', value: parseEther('0.25') };
const hash = keccak256(serializeTransaction(transaccion));

// DER: 30 <largo> 02 <largo de r> <r> 02 <largo de s> <s>. Devuelve dónde empieza y cuánto mide cada entero.
function leerDer(der) {
  if (der[0] !== 0x30 || der[1] !== der.length - 2 || der[2] !== 0x02) throw new Error('No es una firma DER');
  const r = { desde: 4, largo: der[3] };
  if (der[r.desde + r.largo] !== 0x02) throw new Error('No es una firma DER');
  const s = { desde: r.desde + r.largo + 2, largo: der[r.desde + r.largo + 1] };
  return { r, s };
}
// Un entero DER que empieza con un byte de 80 o más lleva un 00 delante. Como número es el mismo.
const numero = (bytes) => `0x${BigInt(bytesToHex(bytes)).toString(16).padStart(64, '0')}`;

try {
  // MessageType DIGEST: el mensaje ya es un hash y KMS lo firma tal cual, sin volver a calcularlo.
  const pedido = { KeyId: ALIAS, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' };
  const respuesta = await kms.send(new SignCommand(pedido));
  const der = respuesta.Signature;
  const { r, s } = leerDer(der);

  console.log('Lo que viaja a KMS:');
  console.log(`  KeyId:            ${pedido.KeyId}`);
  console.log(`  Message:          ${hash} (${pedido.Message.length} bytes)`);
  console.log(`  MessageType:      ${pedido.MessageType}`);
  console.log(`  SigningAlgorithm: ${pedido.SigningAlgorithm}`);
  console.log('\nLo que devuelve KMS:');
  console.log(`≈ Llave que firmó: ${respuesta.KeyId}`);
  console.log(`≈ Firma DER: ${bytesToHex(der)}`);
  console.log(`≈ Largo de la firma: ${der.length} bytes`);
  console.log('\nLa firma por dentro: 30 largo, 02 largo r, 02 largo s');
  console.log(`≈ Entero r: ${r.largo} bytes${der[r.desde] === 0 ? ', el primero es un 00 de relleno' : ''}`);
  console.log(`≈ Entero s: ${s.largo} bytes${der[s.desde] === 0 ? ', el primero es un 00 de relleno' : ''}`);
  console.log(`≈ r: ${numero(der.slice(r.desde, r.desde + r.largo))}`);
  console.log(`≈ s: ${numero(der.slice(s.desde, s.desde + s.largo))}`);
  console.log('\n✔ KMS firmó 32 bytes sin ver la transacción y devolvió dos números, r y s. Todavía no es una firma que la cadena acepte.');
} catch {
  console.error('✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.');
  process.exit(1);
}
