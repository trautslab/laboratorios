// Compila los contratos de un laboratorio: node lib/compilar.mjs <id>
//
// Lee cada .sol de <id>/contratos/ y escribe <id>/contratos/out/<Contrato>.json con el ABI (la
// «interfaz» del contrato, como un archivo de tipos) y el bytecode (lo que se sube a la cadena).
// El JSON se guarda en el repositorio: Node lo lee con `artefacto()` y Rust con la macro `sol!`.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function compilar(id) {
  const solc = createRequire(import.meta.url)('solc');
  const carpeta = path.join(raiz, id, 'contratos');
  const fuentes = Object.fromEntries(readdirSync(carpeta).filter((f) => f.endsWith('.sol')).map((f) => [f, { content: readFileSync(path.join(carpeta, f), 'utf8') }]));
  const entrada = {
    language: 'Solidity',
    sources: fuentes,
    // «paris» evita el opcode PUSH0 y deja el bytecode igual en cualquier versión de Anvil.
    settings: { evmVersion: 'paris', optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } } },
  };
  const salida = JSON.parse(solc.compile(JSON.stringify(entrada)));
  const errores = (salida.errors ?? []).filter((e) => e.severity === 'error');
  if (errores.length) throw new Error(errores.map((e) => e.formattedMessage).join('\n'));
  mkdirSync(path.join(carpeta, 'out'), { recursive: true });
  const escritos = [];
  for (const contratos of Object.values(salida.contracts)) {
    for (const [nombre, c] of Object.entries(contratos)) {
      const artefacto = { contrato: nombre, solc: solc.version().split('+')[0], abi: c.abi, bytecode: { object: `0x${c.evm.bytecode.object}` }, deployedBytecode: { object: `0x${c.evm.deployedBytecode.object}` } };
      writeFileSync(path.join(carpeta, 'out', `${nombre}.json`), `${JSON.stringify(artefacto, null, 2)}\n`);
      escritos.push(nombre);
    }
  }
  return escritos;
}

// artefacto('tokens-minimo', 'Contador') → { abi, bytecode } listo para viem.
export function artefacto(id, nombre) {
  const json = JSON.parse(readFileSync(path.join(raiz, id, 'contratos', 'out', `${nombre}.json`), 'utf8'));
  return { abi: json.abi, bytecode: json.bytecode.object, solc: json.solc };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const id = process.argv[2];
  if (!id) { console.error('Uso: node lib/compilar.mjs <id del laboratorio>'); process.exit(1); }
  console.log(`Compilado: ${compilar(id).join(', ')}`);
}
