// Conexión con la cadena local. viem es para Ethereum lo que `pg` es para Postgres:
// un cliente que habla el protocolo del nodo (JSON-RPC sobre HTTP).
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN, CUENTA_DE_PRUEBA, RPC_URL } from './config.mjs';

// Cliente de solo lectura: saldos, bloques, recibos. También envía transacciones YA firmadas.
export const cadena = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

// Cliente que firma con la llave pública de prueba de Anvil. Solo se usa para "depositar".
export const grifo = createWalletClient({
  chain: CHAIN,
  transport: http(RPC_URL),
  account: privateKeyToAccount(CUENTA_DE_PRUEBA.privateKey),
});

export async function saldoEnEth(address) {
  return formatEther(await cadena.getBalance({ address }));
}

// Falla temprano y con un mensaje útil si Anvil no está corriendo.
export async function exigirCadena() {
  try {
    return await cadena.getChainId();
  } catch {
    throw new Error(`No hay cadena en ${RPC_URL}. Abre otra terminal y corre: npx anvil`);
  }
}
