// Paso 5 · Una aprobación firmada fuera de la cadena y el servicio que la comprueba.
import { isAddressEqual, recoverMessageAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llaves de las cuentas de prueba 0 y 2 de Anvil. Son públicas: nunca las uses con fondos reales.
const aprobadora = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const extrano = privateKeyToAccount('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a');

// El servicio solo guarda direcciones: las de quienes pueden aprobar (cuentas de prueba 0 y 1).
const PERMITIDAS = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];

// Lo que hace el servicio con cada aprobación que recibe: recuperar quién firmó y buscarlo en la lista.
async function revisar(texto, firma) {
  const quien = await recoverMessageAddress({ message: texto, signature: firma });
  const permitido = PERMITIDAS.some((direccion) => isAddressEqual(direccion, quien));
  console.log(`«${texto}»`);
  console.log(`  firmó: ${quien}`);
  console.log(`  ${permitido ? 'está en la lista: APROBADO' : 'no está en la lista: RECHAZADO'}`);
}

const retiro = 'Apruebo el retiro R-17 por 5 ETH';
const firmaValida = await aprobadora.signMessage({ message: retiro });
console.log('1. Firmado por una aprobadora de la lista');
await revisar(retiro, firmaValida);
console.log('\n2. Firmado por alguien que no está en la lista');
await revisar(retiro, await extrano.signMessage({ message: retiro }));
console.log('\n3. La firma del caso 1 con el monto cambiado');
await revisar('Apruebo el retiro R-17 por 50 ETH', firmaValida);
console.log('\n✔ El servicio aprobó una de tres sin guardar ninguna llave: solo una lista de direcciones.');
