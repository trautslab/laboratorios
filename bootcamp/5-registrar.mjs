// Paso 5 · Registrar la raíz del paso 2 en el contrato y verificar pruebas en la cadena.
import { readFileSync } from 'node:fs';
import { BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, getContractAddress, http } from 'viem';
import { anvil } from 'viem/chains';
import { DOCUMENTOS, corto, hex, hoja, prueba, raiz } from './lib/comun.mjs';

const transporte = http('http://127.0.0.1:8545');
const cadena = createPublicClient({ chain: anvil, transport: transporte });
const { abi } = JSON.parse(readFileSync(new URL('./contratos/out/Registro.sol/Registro.json', import.meta.url)));
const DESPLEGO = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // cuenta de prueba 0 de Anvil: corrió forge create
const QUIEN = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // cuenta de prueba 1: registra la raíz
const REGISTRO = getContractAddress({ from: DESPLEGO, nonce: 0n }); // primer contrato de la cuenta 0

const hojas = DOCUMENTOS.map(hoja);
const RAIZ = hex(raiz(hojas));
const PRUEBA = prueba(hojas, 4).map(hex);
const leer = (args) => cadena.readContract({ address: REGISTRO, abi, functionName: 'verificar', args });

try {
  if (!(await cadena.getCode({ address: REGISTRO }))) throw new Error('sin contrato');
} catch {
  console.error(`✖ No hay contrato en ${REGISTRO}. Con Anvil recién arrancado, corre el forge create de este paso.`);
  process.exit(1);
}
console.log(`Registro en ${REGISTRO} (bloque ${await cadena.getBlockNumber({ cacheTime: 0 })}: el despliegue de forge create)`);

// Registrar es una escritura: una transacción de la cuenta 1, que queda anotada como «quien».
const cuenta = createWalletClient({ account: QUIEN, chain: anvil, transport: transporte });
const tx = await cuenta.writeContract({ address: REGISTRO, abi, functionName: 'registrar', args: [RAIZ] });
const recibo = await cadena.waitForTransactionReceipt({ hash: tx });
console.log(`\nregistrar(${corto(raiz(hojas))}) desde la cuenta 1: status ${recibo.status === 'success' ? 1 : 0} · bloque ${recibo.blockNumber} · gas usado ${recibo.gasUsed}`);
const [quien, bloque] = await cadena.readContract({ address: REGISTRO, abi, functionName: 'entradas', args: [RAIZ] });
console.log(`entradas(raíz): quien ${quien} · bloque ${bloque}`);

// El límite de gas es por bloque: cuánto trabajo cabe en él. Este es el de la Anvil local, no el de mainnet.
const limite = (await cadena.getBlock({ blockNumber: recibo.blockNumber })).gasLimit;
console.log(`Límite de gas del bloque ${recibo.blockNumber} en esta Anvil: ${limite} → registrar usa el ${((Number(recibo.gasUsed) / Number(limite)) * 100).toFixed(3)} %`);

// Verificar es una lectura (eth_call): corre en el nodo, no crea bloque ni cuesta comisión.
const alterada = hex(hoja(DOCUMENTOS[4].replace('6.9', '7.9')));
const mutados = DOCUMENTOS.map((d, i) => (i === 1 ? d.replace('nota 5.0', 'nota 7.0') : d));
const raizNoRegistrada = hex(raiz(mutados.map(hoja)));
console.log(`\nverificar(hoja del documento 4, prueba de ${PRUEBA.length} hashes, raíz):  ${await leer([hex(hojas[4]), PRUEBA, RAIZ])}`);
console.log(`verificar(hoja alterada 6.9 → 7.9, misma prueba, raíz): ${await leer([alterada, PRUEBA, RAIZ])}`);
console.log(`verificar(hoja 4, misma prueba, raíz ${raizNoRegistrada.slice(0, 8)}… no registrada): ${await leer([hex(hojas[4]), PRUEBA, raizNoRegistrada])}`);
console.log(`Bloque después de verificar: ${await cadena.getBlockNumber({ cacheTime: 0 })} (leer no crea bloques)`);

// Registrar la misma raíz otra vez: el contrato lo rechaza con su error, y dice quién y cuándo la registró.
try {
  await cadena.simulateContract({ account: DESPLEGO, address: REGISTRO, abi, functionName: 'registrar', args: [RAIZ] });
  console.log('\nregistrar otra vez: aceptado (no debería)');
} catch (e) {
  const revert = e instanceof BaseError ? e.walk((x) => x instanceof ContractFunctionRevertedError) : null;
  const [r, q, b] = revert?.data?.args ?? [];
  console.log(`\nregistrar la misma raíz otra vez: revierte con ${revert?.data?.errorName}(${r?.slice(0, 8)}…, ${q}, ${b})`);
}
console.log('\n✔ La raíz quedó en la cadena con quién y en qué bloque; el contrato verifica la prueba del documento 4.');
