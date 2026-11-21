// Paso 3 · Calcular a mano el hash que firma EIP-712 y comprobar que es el de la librería.
import { concat, encodeAbiParameters, hashTypedData, keccak256, recoverAddress, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const aprobador = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

// El dominio y la aprobación del paso 2.
const dominio = { name: 'Aprobaciones de retiro', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' };
const aprobacion = { retiro: 'RET-0042', destino: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', monto: 25000000000000000000n, vence: 1798761600n };

// 1. El tipo se escribe como un texto, con los nombres de los campos, y de ese texto sale el typeHash.
const textoTipo = 'AprobacionRetiro(string retiro,address destino,uint256 monto,uint256 vence)';
const typeHash = keccak256(toHex(textoTipo));
console.log(`1. Tipo:       ${textoTipo}`);
console.log(`   typeHash:   ${typeHash}`);

// 2. hashStruct: el typeHash y cada valor en 32 bytes, en el orden del tipo. Un string entra como su hash.
const hashMensaje = keccak256(encodeAbiParameters(
  [{ type: 'bytes32' }, { type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }, { type: 'uint256' }],
  [typeHash, keccak256(toHex(aprobacion.retiro)), aprobacion.destino, aprobacion.monto, aprobacion.vence],
));
console.log(`2. hashStruct: ${hashMensaje}`);

// 3. El dominio es otra estructura, EIP712Domain, y se trata igual. Su hash es el separador de dominio.
const textoDominio = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
const separador = keccak256(encodeAbiParameters(
  [{ type: 'bytes32' }, { type: 'bytes32' }, { type: 'bytes32' }, { type: 'uint256' }, { type: 'address' }],
  [keccak256(toHex(textoDominio)), keccak256(toHex(dominio.name)), keccak256(toHex(dominio.version)), BigInt(dominio.chainId), dominio.verifyingContract],
));
console.log(`3. Dominio:    ${textoDominio}`);
console.log(`   separador:  ${separador}`);

// 4. Lo que se firma es el hash de 66 bytes: 0x19, 0x01, el separador y el hashStruct del mensaje.
const sobre = concat(['0x1901', separador, hashMensaje]);
const digest = keccak256(sobre);
console.log(`4. 0x1901 + separador + hashStruct = ${(sobre.length - 2) / 2} bytes`);
console.log(`   digest:     ${digest}`);

// La librería llega al mismo hash partiendo del dominio, los tipos y el mensaje.
const tipos = { AprobacionRetiro: [{ name: 'retiro', type: 'string' }, { name: 'destino', type: 'address' }, { name: 'monto', type: 'uint256' }, { name: 'vence', type: 'uint256' }] };
const datos = { domain: dominio, types: tipos, primaryType: 'AprobacionRetiro', message: aprobacion };
const deLaLibreria = hashTypedData(datos);
console.log(`\nLa librería:   ${deLaLibreria}`);
console.log(`Son iguales:   ${digest === deLaLibreria ? 'sí' : 'no'}`);

// La firma del paso 2 es una firma corriente sobre ese digest: de los dos sale quien firmó.
const firma = await aprobador.signTypedData(datos);
const recuperada = await recoverAddress({ hash: digest, signature: firma });
console.log(`\nFirma del paso 2: ${firma}`);
console.log(`Recuperada con el digest hecho a mano: ${recuperada}`);
console.log('\n✔ Firmar datos con tipos es firmar un hash de 32 bytes que cualquiera puede recalcular desde los campos.');
