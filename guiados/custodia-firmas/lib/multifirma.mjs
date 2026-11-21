// La multifirma vista desde Node: compilar el contrato, juntar firmas y enviarlas.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { cadena, exigir, grifo, leer, PERSONAS } from './comun.mjs';

// Compila Solidity con solc, que es un paquete de npm. Devuelve el ABI (la «interfaz» del
// contrato, como un archivo de tipos) y el bytecode (lo que se sube a la cadena).
export function compilar() {
  const solc = createRequire(import.meta.url)('solc');
  const fuente = readFileSync(fileURLToPath(new URL('../contratos/Multifirma.sol', import.meta.url)), 'utf8');
  const entrada = {
    language: 'Solidity',
    sources: { 'Multifirma.sol': { content: fuente } },
    settings: { evmVersion: 'paris', optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
  };
  const salida = JSON.parse(solc.compile(JSON.stringify(entrada)));
  const errores = (salida.errors ?? []).filter((e) => e.severity === 'error');
  if (errores.length) throw new Error(errores[0].formattedMessage);
  const contrato = salida.contracts['Multifirma.sol'].Multifirma;
  return { abi: contrato.abi, bytecode: `0x${contrato.evm.bytecode.object}`, version: solc.version() };
}

export function multifirma() {
  return exigir(leer('multifirma.json'), 'Falta la multifirma. Corre antes: node 01-desplegar.mjs');
}

// Cada persona firma la huella con su propia llave. El contrato pide las firmas ordenadas
// por dirección de quien firma.
export async function juntarFirmas(huella, nombres) {
  const firmas = await Promise.all(nombres.map(async (nombre) => ({ nombre, direccion: PERSONAS[nombre].address, firma: await PERSONAS[nombre].signMessage({ message: { raw: huella } }) })));
  return firmas.sort((a, b) => (BigInt(a.direccion) < BigInt(b.direccion) ? -1 : 1));
}

// Pide la huella al contrato, junta las firmas y envía `ejecutar`. Quien envía (el grifo)
// solo paga el gas: no necesita ser dueño.
export async function ejecutar({ destino, valor, datos = '0x', firmantes, desordenar = false }) {
  const { address, abi } = multifirma();
  const nonce = await cadena.readContract({ address, abi, functionName: 'nonce' });
  const huella = await cadena.readContract({ address, abi, functionName: 'huella', args: [destino, valor, datos, nonce] });
  let firmas = await juntarFirmas(huella, firmantes);
  if (desordenar) firmas = firmas.reverse();
  const hash = await grifo.writeContract({ address, abi, functionName: 'ejecutar', args: [destino, valor, datos, firmas.map((f) => f.firma)], gas: 300_000n });
  const recibo = await cadena.waitForTransactionReceipt({ hash });
  return { recibo, huella, firmas };
}

// Cuando el contrato rechaza, el nodo devuelve el motivo del `require`. Esto lo extrae.
export async function motivoDeRechazo({ destino, valor, datos = '0x', firmantes }) {
  const { address, abi } = multifirma();
  const nonce = await cadena.readContract({ address, abi, functionName: 'nonce' });
  const huella = await cadena.readContract({ address, abi, functionName: 'huella', args: [destino, valor, datos, nonce] });
  const firmas = await juntarFirmas(huella, firmantes);
  try {
    await cadena.simulateContract({ address, abi, functionName: 'ejecutar', args: [destino, valor, datos, firmas.map((f) => f.firma)], account: grifo.account });
    return null;
  } catch (error) {
    return error.cause?.reason ?? error.shortMessage;
  }
}
