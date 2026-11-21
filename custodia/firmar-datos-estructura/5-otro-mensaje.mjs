// Paso 5 · La misma firma con el mensaje cambiado: el monto, el destino o el nombre de un campo.
import { hashTypedData, recoverAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const aprobador = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// El dominio, los tipos y la aprobación del paso 2.
const dominio = { name: 'Aprobaciones de retiro', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' };
const tipos = { AprobacionRetiro: [{ name: 'retiro', type: 'string' }, { name: 'destino', type: 'address' }, { name: 'monto', type: 'uint256' }, { name: 'vence', type: 'uint256' }] };
const aprobacion = { retiro: 'RET-0042', destino: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', monto: 25000000000000000000n, vence: 1798761600n };

// La firma se hace una sola vez, sobre la aprobación original.
const firma = await aprobador.signTypedData({ domain: dominio, types: tipos, primaryType: 'AprobacionRetiro', message: aprobacion });
console.log(`Aprobó:  ${aprobador.address}`);
console.log(`Firma:   ${firma}\n`);

// El último caso no toca ningún valor: solo llama «beneficiario» al campo que se firmó como «destino».
const otrosTipos = { AprobacionRetiro: [{ name: 'retiro', type: 'string' }, { name: 'beneficiario', type: 'address' }, { name: 'monto', type: 'uint256' }, { name: 'vence', type: 'uint256' }] };
const { destino, ...resto } = aprobacion;

// Alguien presenta la firma junto a un mensaje retocado. El dominio es el correcto en los cuatro casos.
const casos = [
  ['El mensaje que se firmó', tipos, aprobacion],
  ['Monto: 250 ETH en lugar de 25', tipos, { ...aprobacion, monto: 250000000000000000000n }],
  ['Destino: 0x15d3…6A65', tipos, { ...aprobacion, destino: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' }],
  ['Mismos valores, el campo «destino» se llama «beneficiario»', otrosTipos, { ...resto, beneficiario: destino }],
];
for (const [nombre, t, mensaje] of casos) {
  const digest = hashTypedData({ domain: dominio, types: t, primaryType: 'AprobacionRetiro', message: mensaje });
  const recuperada = await recoverAddress({ hash: digest, signature: firma });
  console.log(nombre);
  console.log(`  digest:     ${digest}`);
  console.log(`  recuperada: ${recuperada}`);
  console.log(`  ${recuperada === aprobador.address ? 'Es quien aprobó.' : 'No es quien aprobó: la firma no cubre este mensaje.'}`);
}
console.log('\n✔ Valores, nombres y tipos están dentro de lo firmado: cambiar uno cambia el digest.');
