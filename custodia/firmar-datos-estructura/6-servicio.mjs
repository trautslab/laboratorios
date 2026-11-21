// Paso 6 · El servicio de aprobaciones: verifica datos con tipos, guarda lo legible y no acepta hashes.
import { recoverTypedDataAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llaves de las cuentas de prueba 0 y 2 de Anvil. Son públicas: nunca las uses con fondos reales.
const aprobador = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const ajeno = privateKeyToAccount('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a');

// El dominio, los tipos y la aprobación del paso 2.
const dominio = { name: 'Aprobaciones de retiro', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' };
const tipos = { AprobacionRetiro: [{ name: 'retiro', type: 'string' }, { name: 'destino', type: 'address' }, { name: 'monto', type: 'uint256' }, { name: 'vence', type: 'uint256' }] };
const aprobacion = { retiro: 'RET-0042', destino: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', monto: 25000000000000000000n, vence: 1798761600n };

// Lo que el servicio tiene configurado: quién puede aprobar. El dominio y los tipos también son suyos.
const APROBADORES = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
const registro = [];

async function recibir(pedido) {
  // Una aprobación no entra como hash: el servicio no podría saber ni guardar qué se aprobó.
  if (pedido.hash) return 'rechazada: llegó un hash y no los campos de la aprobación';
  // El hash se calcula aquí, con el dominio y los tipos del servicio y los campos que llegaron.
  const firmante = await recoverTypedDataAddress({ domain: dominio, types: tipos, primaryType: 'AprobacionRetiro', message: pedido.aprobacion, signature: pedido.firma });
  if (!APROBADORES.includes(firmante)) return `rechazada: la firma lleva a ${firmante}, que no está en la lista`;
  // Se guardan los campos legibles junto a la firma: cualquiera puede leerlos y verificarla otra vez.
  registro.push({ ...pedido.aprobacion, firmante, firma: pedido.firma });
  return `aceptada: firmó ${firmante}`;
}

const datos = { domain: dominio, types: tipos, primaryType: 'AprobacionRetiro', message: aprobacion };
const firma = await aprobador.signTypedData(datos);
// El hash del paso 1: 32 bytes que no dicen qué aprueban.
const hashOpaco = '0x58052a5ff49a4e4c320b0c58ee1a271eb123d4a2fb3ffe0b17eeeb87c6ec047f';
const pedidos = [
  ['Un aprobador de la lista firma los datos con tipos', { aprobacion, firma }],
  ['Los mismos datos, firmados por una llave que no está en la lista', { aprobacion, firma: await ajeno.signTypedData(datos) }],
  ['La firma del aprobador, con el monto cambiado a 250 ETH', { aprobacion: { ...aprobacion, monto: 250000000000000000000n }, firma }],
  ['Un aprobador de la lista firma un hash de 32 bytes', { hash: hashOpaco, firma: await aprobador.sign({ hash: hashOpaco }) }],
];
for (const [nombre, pedido] of pedidos) {
  console.log(nombre);
  console.log(`  ${await recibir(pedido)}`);
}

console.log(`\nRegistro del servicio: ${registro.length} aprobación`);
for (const r of registro) {
  console.log(`  retiro:   ${r.retiro}`);
  console.log(`  destino:  ${r.destino}`);
  console.log(`  monto:    ${r.monto}`);
  console.log(`  vence:    ${r.vence}`);
  console.log(`  firmante: ${r.firmante}`);
  console.log(`  firma:    ${r.firma}`);
}
console.log('\n✔ Entró una sola aprobación, y el registro dice en claro qué se aprobó y quién lo firmó.');
