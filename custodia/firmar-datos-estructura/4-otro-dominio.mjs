// Paso 4 · La misma firma con otro dominio: otra red, otro contrato u otra aplicación.
import { hashTypedData, recoverAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const aprobador = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// El dominio, los tipos y la aprobación del paso 2.
const dominio = { name: 'Aprobaciones de retiro', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' };
const tipos = { AprobacionRetiro: [{ name: 'retiro', type: 'string' }, { name: 'destino', type: 'address' }, { name: 'monto', type: 'uint256' }, { name: 'vence', type: 'uint256' }] };
const aprobacion = { retiro: 'RET-0042', destino: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', monto: 25000000000000000000n, vence: 1798761600n };

// La firma se hace una sola vez, con el dominio original.
const firma = await aprobador.signTypedData({ domain: dominio, types: tipos, primaryType: 'AprobacionRetiro', message: aprobacion });
console.log(`Aprobó:  ${aprobador.address}`);
console.log(`Firma:   ${firma}\n`);

// Cuatro verificadores reciben la misma firma y el mismo mensaje. Cada uno usa su propio dominio.
const dominios = [
  ['El dominio con el que se firmó', dominio],
  ['Otra red: chain id 11155111', { ...dominio, chainId: 11155111 }],
  ['Otro contrato verificador: 0xbBbB…BBbB', { ...dominio, verifyingContract: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' }],
  ['Otra aplicación: «Pagos a proveedores»', { ...dominio, name: 'Pagos a proveedores' }],
];
for (const [nombre, d] of dominios) {
  const digest = hashTypedData({ domain: d, types: tipos, primaryType: 'AprobacionRetiro', message: aprobacion });
  const recuperada = await recoverAddress({ hash: digest, signature: firma });
  console.log(nombre);
  console.log(`  digest:     ${digest}`);
  console.log(`  recuperada: ${recuperada}`);
  console.log(`  ${recuperada === aprobador.address ? 'Es quien aprobó.' : 'No es quien aprobó: aquí la firma no vale.'}`);
}
console.log('\n✔ La firma solo lleva a quien aprobó con el dominio exacto con el que se firmó.');
