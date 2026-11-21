// Lo común a todos los pasos: conexión con la cadena local, personajes, estado y salida.
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

export const RPC_URL = process.env.LAB_RPC_URL ?? 'http://127.0.0.1:8545';
export const cadena = createPublicClient({ chain: anvil, transport: http(RPC_URL) });

// Cuenta de prueba n.º 0 de Anvil: reparte ETH ficticio y hace de «quien envía» las transacciones.
// Su llave es pública, como todas las de este archivo. No las uses fuera del laboratorio.
export const grifo = createWalletClient({ chain: anvil, transport: http(RPC_URL), account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') });

// Ana, la clienta que retira (cuenta de prueba n.º 1).
export const ANA = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

// Las tres personas que firman (cuentas de prueba 7, 8 y 9) y una que no debería (la 6).
export const PERSONAS = {
  Carla: privateKeyToAccount('0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356'),
  Diego: privateKeyToAccount('0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97'),
  Elena: privateKeyToAccount('0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'),
  Mallory: privateKeyToAccount('0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e'),
};
export const DUENOS = ['Carla', 'Diego', 'Elena'];
export const nombreDe = (direccion) => Object.entries(PERSONAS).find(([, cuenta]) => cuenta.address === direccion)?.[0] ?? direccion;

export const saldoEnEth = async (address) => formatEther(await cadena.getBalance({ address }));

export async function exigirCadena() {
  try {
    return await cadena.getChainId();
  } catch {
    throw new Error(`No hay cadena en ${RPC_URL}. Abre otra terminal y corre: npx anvil`);
  }
}

// Estado entre pasos: archivos JSON en .estado/.
const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.estado');
export const leer = (nombre, porDefecto = null) => (existsSync(path.join(carpeta, nombre)) ? JSON.parse(readFileSync(path.join(carpeta, nombre), 'utf8')) : porDefecto);
export function guardar(nombre, datos) {
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(path.join(carpeta, nombre), `${JSON.stringify(datos, null, 2)}\n`);
}
export const borrarEstado = () => rmSync(carpeta, { recursive: true, force: true });
export const exigir = (dato, mensaje) => {
  if (!dato) throw new Error(mensaje);
  return dato;
};

// Salida pareja en la terminal.
export const titulo = (texto) => console.log(`\n== ${texto} ==`);
export const dato = (etiqueta, valor) => console.log(`${`${etiqueta}:`.padEnd(27)} ${valor}`);
export const nota = (texto) => console.log(`   ${texto}`);
export const listo = (texto) => console.log(`\n✔ ${texto}`);
export const corto = (hex, inicio = 12, fin = 8) => (hex.length > inicio + fin + 1 ? `${hex.slice(0, inicio)}…${hex.slice(-fin)}` : hex);
export function terminar(error) {
  console.error(`\n✖ ${error.message}`);
  process.exit(1);
}
export { appendFileSync };
