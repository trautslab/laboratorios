// Paso 2 · La misma aprobación como datos con tipos (EIP-712): la wallet puede mostrar cada campo.
import { recoverTypedDataAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const aprobador = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// El dominio dice dónde vale la firma: qué aplicación, qué versión, qué red y qué contrato la verifica.
const dominio = {
  name: 'Aprobaciones de retiro',
  version: '1',
  chainId: 1,
  verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
};

// Los tipos dicen qué campos tiene una aprobación: nombre, tipo y orden.
const tipos = {
  AprobacionRetiro: [
    { name: 'retiro', type: 'string' },
    { name: 'destino', type: 'address' },
    { name: 'monto', type: 'uint256' },
    { name: 'vence', type: 'uint256' },
  ],
};

// El mensaje: una aprobación concreta. 25 ETH en wei; vence el 1 de enero de 2027.
const aprobacion = {
  retiro: 'RET-0042',
  destino: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  monto: 25000000000000000000n,
  vence: 1798761600n,
};

// Esto es lo que recibe la wallet. Como trae nombres y tipos, puede mostrarlo antes de pedir la firma.
const datos = { domain: dominio, types: tipos, primaryType: 'AprobacionRetiro', message: aprobacion };
console.log('Lo que la wallet puede mostrar antes de firmar:');
console.log(`  Aplicación: ${dominio.name} (versión ${dominio.version})`);
console.log(`  Red:        chain id ${dominio.chainId}`);
console.log(`  Contrato:   ${dominio.verifyingContract}`);
console.log(`  ${datos.primaryType}`);
for (const campo of tipos.AprobacionRetiro) {
  console.log(`    ${campo.name.padEnd(8)} ${campo.type.padEnd(8)} ${aprobacion[campo.name]}`);
}

// La librería calcula el hash a partir del dominio, los tipos y el mensaje, y firma ese hash.
const firma = await aprobador.signTypedData(datos);
console.log(`\nFirma (${(firma.length - 2) / 2} bytes):`);
console.log(firma);

// Verificar pide lo mismo que firmar: los datos completos. De ellos y la firma sale quién firmó.
const recuperada = await recoverTypedDataAddress({ ...datos, signature: firma });
console.log(`\nDirección recuperada:  ${recuperada}`);
console.log(`Dirección de la llave: ${aprobador.address}`);
console.log('\n✔ Lo firmado trae aplicación, red, contrato y cuatro campos con nombre: hay algo que leer antes de aprobar.');
