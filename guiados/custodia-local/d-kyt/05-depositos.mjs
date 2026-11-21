// Paso 5 · Depósitos: no puedes impedir que te envíen fondos, pero sí decidir qué haces con ellos.
import { createWalletClient, http, parseEther } from 'viem';
import { cadena, exigirCadena } from '../lib/cadena.mjs';
import { CHAIN, RPC_URL } from '../lib/config.mjs';
import { anotar, leer } from '../lib/estado.mjs';
import { calcularExposicion, cuentaDe, decidir, indexar, pct } from '../lib/kyt.mjs';
import { acreditar, saldoCliente } from '../lib/libro.mjs';
import { dato, listo, nota, terminar, titulo } from '../lib/salida.mjs';

const DEPOSITOS = [
  ['Ana', '3'],
  ['Beto', '2'],
  ['Dana', '2'],
  ['Rita', '4'],
];
const ACCION = { PERMITIR: 'acreditado', REVISAR: 'retenido hasta revisión', BLOQUEAR: 'en cuarentena, sin acreditar' };

try {
  await exigirCadena();
  const custodio = leer('llaves.json').kyt;
  if (!custodio) throw new Error('Falta el escenario. Corre antes: node d-kyt/01-escenario.mjs');

  titulo('Depósitos que llegan a la wallet del custodio');
  for (const [cliente, montoEth] of DEPOSITOS) {
    const wallet = createWalletClient({ chain: CHAIN, transport: http(RPC_URL), account: cuentaDe(cliente) });
    const hash = await wallet.sendTransaction({ to: custodio.address, value: parseEther(montoEth) });
    await cadena.waitForTransactionReceipt({ hash });

    // El depósito YA está en la cadena. Ahora se mira de dónde venía ese dinero.
    const { porTransferencia } = calcularExposicion(await indexar());
    const proporcion = porTransferencia.at(-1).proporcion;
    const veredicto = decidir({ listada: false, proporcion });
    if (veredicto.decision === 'PERMITIR') acreditar(cliente, montoEth, 'depósito');
    anotar({ cuando: new Date().toISOString(), tipo: 'depósito', cliente, montoEth, exposicion: proporcion, ...veredicto, resultado: ACCION[veredicto.decision] });
    dato(`${cliente} deposita ${montoEth} ETH`, `exposición ${pct(proporcion)} → ${veredicto.decision} · ${ACCION[veredicto.decision]}`);
  }

  titulo('Libro del custodio');
  for (const [cliente] of DEPOSITOS) dato(cliente, `${saldoCliente(cliente)} ETH`);
  nota('Los 4 ETH de Rita llegaron a la wallet del custodio, pero no a su saldo: no puede usarlos.');
  nota('Recibir no se puede bloquear. Lo que se controla es acreditar y dejar usar.');
  listo('Dos depósitos acreditados, uno retenido y uno en cuarentena.');
} catch (error) {
  terminar(error);
}
