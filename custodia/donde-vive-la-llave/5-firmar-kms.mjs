// Paso 5 · Firmar con el KMS: viaja el hash, vuelve la firma. La llave no se mueve.
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hexToBytes, keccak256, toHex } from 'viem';

const KMS = 'http://localhost:4566'; // Floci, el emulador local
const ALIAS = 'alias/ruta-donde-vive-la-llave';
const HASH = keccak256(toHex('Orden de retiro 42: 1 ETH para Ana')); // los mismos 32 bytes del paso 1
const OTRO_HASH = keccak256(toHex('Orden de retiro 43: 100 ETH para Ana'));
// Credenciales FICTICIAS escritas aquí a propósito: el cliente nunca mira las de tu máquina.
const kms = new KMSClient({ endpoint: KMS, region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });

// DIGEST: lo que se envía ya es un hash, el servicio no lo vuelve a pasar por SHA-256.
async function firmar(hash) {
  const peticion = { KeyId: ALIAS, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' };
  return kms.send(new SignCommand(peticion));
}

try {
  const primera = await firmar(HASH);
  const segunda = await firmar(HASH);
  console.log('Firmar con el KMS: viaja el hash, la llave no');
  console.log(`  Hash enviado: ${HASH}`);
  console.log(`  Petición: Sign · KeyId ${ALIAS} · MessageType DIGEST`);
  console.log(`  Algoritmo que devuelve el servicio: ${primera.SigningAlgorithm}`);
  console.log(`≈ Firma 1 (DER): ${toHex(primera.Signature)}`);
  console.log(`≈ Firma 2 (DER): ${toHex(segunda.Signature)}`);
  console.log(`  ¿Las dos firmas del mismo hash son iguales? ${toHex(primera.Signature) === toHex(segunda.Signature) ? 'sí' : 'no'}`);

  // Verificar fuera del KMS: alcanza con la llave pública. Los últimos 65 bytes del DER son el punto de la curva.
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: ALIAS }));
  const punto = PublicKey.slice(-65);
  // lowS: false porque el KMS puede devolver la S alta, que para ECDSA es igual de válida.
  const vale = (firma, hash) => (secp256k1.verify(firma, hexToBytes(hash), punto, { prehash: false, format: 'der', lowS: false }) ? 'válida' : 'no válida');
  console.log('\nVerificar con la llave pública, sin el KMS');
  console.log(`  Firma 1 sobre el hash: ${vale(primera.Signature, HASH)}`);
  console.log(`  Firma 2 sobre el hash: ${vale(segunda.Signature, HASH)}`);
  console.log(`  Firma 1 sobre otro hash: ${vale(primera.Signature, OTRO_HASH)}`);
  console.log('  Bytes de llave privada que pasaron por este programa: 0');
  console.log('✔ El KMS firmó dos veces y las dos firmas verifican con la llave pública. La privada no salió del servicio.');
} catch (error) {
  console.error(`✖ No se pudo firmar (${error.name}). Corre antes el paso 4 y comprueba que el emulador está arrancado.`);
  process.exit(1);
}
