// Configuración única del laboratorio. Todo apunta a tu máquina: nada sale a internet.
import { anvil } from 'viem/chains';

// Cadena local: Anvil escucha aquí cuando corres `npx anvil`.
export const RPC_URL = process.env.LAB_RPC_URL ?? 'http://127.0.0.1:8545';
export const CHAIN = anvil; // chain id 31337

// Llavero local: Floci emula el servicio KMS de AWS en este puerto.
export const KMS_ENDPOINT = process.env.LAB_KMS_ENDPOINT ?? 'http://127.0.0.1:4566';

// Credenciales FICTICIAS a propósito. El cliente las usa en lugar de cualquier credencial
// real que tengas en tu máquina, así el laboratorio nunca puede tocar una cuenta de AWS.
export const KMS_CLIENT_CONFIG = {
  endpoint: KMS_ENDPOINT,
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
};

// Cuenta de prueba n.º 0 de Anvil. Su llave privada es PÚBLICA (viene en la documentación
// de Foundry): sirve solo para repartir ETH ficticio en la cadena local.
export const CUENTA_DE_PRUEBA = {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
};

// Clientes ficticios del custodio: cuentas de prueba n.º 1 y n.º 2 de Anvil.
export const CLIENTE_ANA = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
export const CLIENTE_LUIS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
// Una dirección que nadie dio de alta (cuenta de prueba n.º 3).
export const DESCONOCIDO = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
