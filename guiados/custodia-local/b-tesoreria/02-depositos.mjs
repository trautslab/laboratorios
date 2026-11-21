// Paso 2 · Los clientes depositan y el custodio lo anota en su libro.
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { cadena, exigirCadena, saldoEnEth } from '../lib/cadena.mjs';
import { CHAIN, RPC_URL } from '../lib/config.mjs';
import { carteras } from '../lib/estado.mjs';
import { acreditar, saldoCliente } from '../lib/libro.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

// Llaves públicas de prueba de Anvil (cuentas 1 y 2): hacen de wallets personales de los clientes.
const CLIENTES = {
  Ana: { llave: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', montoEth: '6' },
  Luis: { llave: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', montoEth: '4' },
};

try {
  await exigirCadena();
  const { depositos } = carteras();

  for (const [nombre, { llave, montoEth }] of Object.entries(CLIENTES)) {
    const wallet = createWalletClient({ chain: CHAIN, transport: http(RPC_URL), account: privateKeyToAccount(llave) });
    const hash = await wallet.sendTransaction({ to: depositos[nombre].address, value: parseEther(montoEth) });
    const recibo = await cadena.waitForTransactionReceipt({ hash });
    // El depósito se acredita cuando la cadena lo confirma, no cuando el cliente dice que lo envió.
    acreditar(nombre, montoEth, `depósito, bloque ${recibo.blockNumber}`);
  }

  titulo('En la cadena: cuánto hay en cada dirección de depósito');
  dato('Depósitos de Ana', `${await saldoEnEth(depositos.Ana.address)} ETH`);
  dato('Depósitos de Luis', `${await saldoEnEth(depositos.Luis.address)} ETH`);
  titulo('En el libro: cuánto le debe el custodio a cada cliente');
  dato('Ana', `${saldoCliente('Ana')} ETH`);
  dato('Luis', `${saldoCliente('Luis')} ETH`);
  nota('Por ahora coinciden. Desde el próximo paso dejarán de coincidir, y está bien.');
  listo('Dos depósitos confirmados y anotados.');
} catch (error) {
  terminar(error);
}
