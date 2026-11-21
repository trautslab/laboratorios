// El llavero: KMS guarda la llave privada y firma por nosotros. La llave nunca sale de ahí.
// Este archivo traduce entre lo que entrega KMS y lo que Ethereum espera.
import { CreateKeyCommand, DisableKeyCommand, EnableKeyCommand, GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { bytesToHex, getAddress, hexToBytes, keccak256, recoverAddress } from 'viem';
import { KMS_CLIENT_CONFIG, KMS_ENDPOINT } from './config.mjs';

export const kms = new KMSClient(KMS_CLIENT_CONFIG);

// Cuenta cuántas veces pedimos una firma: sirve para demostrar que un retiro
// rechazado por la política nunca llega al llavero.
export const contador = { firmas: 0 };

export async function exigirLlavero() {
  try {
    const salud = await (await fetch(`${KMS_ENDPOINT}/_floci/health`)).json();
    if (salud.services?.kms !== 'running') throw new Error('KMS apagado');
    return salud;
  } catch {
    throw new Error(`No hay llavero en ${KMS_ENDPOINT}. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0`);
  }
}

// Crea una llave de firma en la curva secp256k1, la misma que usa Ethereum.
export async function crearLlave(descripcion) {
  const { KeyMetadata } = await kms.send(
    new CreateKeyCommand({ KeySpec: 'ECC_SECG_P256K1', KeyUsage: 'SIGN_VERIFY', Description: descripcion }),
  );
  return KeyMetadata;
}

// KMS entrega la llave PÚBLICA envuelta en un formato estándar (DER). Los últimos 65 bytes
// son el punto de la curva: un 0x04 seguido de las coordenadas X e Y (32 bytes cada una).
export async function llavePublica(keyId) {
  const { PublicKey } = await kms.send(new GetPublicKeyCommand({ KeyId: keyId }));
  const der = new Uint8Array(PublicKey);
  const punto = der.slice(-65);
  if (punto[0] !== 0x04) throw new Error('La llave pública no viene en formato sin comprimir');
  return { der, punto, xy: punto.slice(1) };
}

// Dirección de Ethereum = últimos 20 bytes de keccak256(X || Y).
export function direccionDesde(xy) {
  const hash = keccak256(xy);
  return getAddress(`0x${hash.slice(-40)}`);
}

// Una firma DER es: 30 len 02 lenR R 02 lenS S. Sacamos los dos números R y S.
export function leerFirmaDer(der) {
  let i = 2;
  if (der[1] & 0x80) i += der[1] & 0x7f;
  const leerEntero = () => {
    if (der[i] !== 0x02) throw new Error('Firma DER inválida');
    const largo = der[i + 1];
    const valor = der.slice(i + 2, i + 2 + largo);
    i += 2 + largo;
    return BigInt(bytesToHex(valor));
  };
  return { r: leerEntero(), s: leerEntero() };
}

// Orden de la curva secp256k1 (cuántos puntos tiene).
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const aHex32 = (n) => `0x${n.toString(16).padStart(64, '0')}`;

// Pide a KMS que firme un hash de 32 bytes y deja la firma lista para Ethereum.
export async function firmarHash(keyId, hash, direccionEsperada) {
  contador.firmas += 1;
  const { Signature } = await kms.send(
    new SignCommand({ KeyId: keyId, Message: hexToBytes(hash), MessageType: 'DIGEST', SigningAlgorithm: 'ECDSA_SHA_256' }),
  );
  const der = new Uint8Array(Signature);
  let { r, s } = leerFirmaDer(der);

  // Ethereum solo acepta la mitad baja de S (EIP-2). Si KMS devolvió la alta, usamos N − S:
  // es la misma firma vista desde el otro lado de la curva.
  const sOriginalAlta = s > N / 2n;
  if (sOriginalAlta) s = N - s;

  // KMS no dice cuál de los dos puntos posibles corresponde a la firma (yParity 0 o 1).
  // Probamos ambos y nos quedamos con el que recupera NUESTRA dirección.
  for (const yParity of [0, 1]) {
    const firma = { r: aHex32(r), s: aHex32(s), yParity };
    const recuperada = await recoverAddress({ hash, signature: firma });
    if (recuperada === direccionEsperada) return { ...firma, der, sOriginalAlta };
  }
  throw new Error('La firma no corresponde a la dirección esperada');
}

export const deshabilitarLlave = (keyId) => kms.send(new DisableKeyCommand({ KeyId: keyId }));
export const habilitarLlave = (keyId) => kms.send(new EnableKeyCommand({ KeyId: keyId }));
