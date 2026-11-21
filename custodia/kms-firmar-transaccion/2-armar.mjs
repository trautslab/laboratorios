// Paso 2 · Armar la transacción sin firmar y calcular el hash que se va a firmar.
import { formatEther, formatGwei, keccak256, parseEther, parseGwei, serializeTransaction } from 'viem';

// Todos los campos, escritos a mano. No hay campo «de»: quién envía sale de la firma.
const transaccion = {
  chainId: 31337,
  nonce: 0,
  maxPriorityFeePerGas: parseGwei('1'),
  maxFeePerGas: parseGwei('2'),
  gas: 21000n,
  to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  value: parseEther('0.25'),
};

// Sin firma, la serialización es el byte de tipo 02 seguido de la lista de campos.
const sinFirma = serializeTransaction(transaccion);
// Lo que se firma es el keccak256 de esos bytes: siempre 32 bytes.
const hash = keccak256(sinFirma);

console.log('Transacción sin firmar (tipo 2):');
console.log(`  chain id:         ${transaccion.chainId}`);
console.log(`  nonce:            ${transaccion.nonce}`);
console.log(`  propina máxima:   ${formatGwei(transaccion.maxPriorityFeePerGas)} gwei por gas`);
console.log(`  comisión máxima:  ${formatGwei(transaccion.maxFeePerGas)} gwei por gas`);
console.log(`  gas:              ${transaccion.gas}`);
console.log(`  para:             ${transaccion.to}`);
console.log(`  valor:            ${formatEther(transaccion.value)} ETH`);
console.log(`\nSerializada sin firma (${(sinFirma.length - 2) / 2} bytes):`);
console.log(sinFirma);
console.log(`\nHash a firmar (${(hash.length - 2) / 2} bytes):`);
console.log(hash);
console.log('\n✔ Esos 32 bytes son lo único que va a recibir KMS. Este script no habló con KMS ni con la cadena.');
