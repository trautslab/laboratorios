// Paso 1 · Firmar el hash de una aprobación: quien firma solo ve 32 bytes.
import { encodeAbiParameters, keccak256, recoverAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const aprobador = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// Dos aprobaciones de retiro. El monto va en wei (25 ETH) y el vencimiento en segundos desde 1970.
const A = { retiro: 'RET-0042', destino: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', monto: 25000000000000000000n, vence: 1798761600n };
// La B cambia el destino y multiplica el monto por diez.
const B = { retiro: 'RET-0042', destino: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', monto: 250000000000000000000n, vence: 1798761600n };

// La aplicación junta los cuatro valores a su manera y calcula un hash. Eso es lo que manda a firmar.
const forma = [{ type: 'string' }, { type: 'address' }, { type: 'uint256' }, { type: 'uint256' }];
const hashDe = (a) => keccak256(encodeAbiParameters(forma, [a.retiro, a.destino, a.monto, a.vence]));

for (const [titulo, a] of [['Aprobación A, la que la persona cree aprobar:', A], ['Aprobación B, con otro destino y diez veces el monto:', B]]) {
  console.log(titulo);
  console.log(`  retiro:  ${a.retiro}`);
  console.log(`  destino: ${a.destino}`);
  console.log(`  monto:   ${a.monto}`);
  console.log(`  vence:   ${a.vence}`);
  console.log(`  En la pantalla de quien firma: ${hashDe(a)}\n`);
}

// A la persona le llega el hash de B. No tiene con qué distinguirlo del de A, y firma.
const firma = await aprobador.sign({ hash: hashDe(B) });
console.log('La persona firma el hash que le llegó, el de B:');
console.log(`  firma (${(firma.length - 2) / 2} bytes): ${firma}`);

// La firma es correcta: del hash y la firma se recupera la dirección de quien firmó.
const recuperada = await recoverAddress({ hash: hashDe(B), signature: firma });
console.log(`  dirección recuperada: ${recuperada}`);
console.log(`  dirección de la llave: ${aprobador.address}`);
console.log('\n✔ La firma vale para B. En la pantalla hubo 32 bytes: nada decía a quién ni cuánto.');
