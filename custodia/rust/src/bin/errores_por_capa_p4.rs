// Paso 4 · Capa de ejecución: la transacción entra en un bloque, paga comisión y falla en el contrato.
use alloy::primitives::{address, hex, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::PrivateKeySigner;
use alloy::sol;
use alloy::sol_types::{Revert, SolError};

// El contrato ya compilado: de aquí sale la lista de sus funciones (laboratorio 19).
sol!(#[sol(rpc)] Caja, "../errores-por-capa/contratos/out/Caja.json");

// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Nunca la uses en una red real.
const LLAVE: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CAJA: Address = address!("700b6A60ce7EaaEA56F065753d8dcB9653dbAD35"); // donde la dejó errores_por_capa_p4_contrato

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cuenta: PrivateKeySigner = LLAVE.parse()?;
    let origen = cuenta.address();
    let cadena = ProviderBuilder::new().wallet(cuenta).connect_http("http://127.0.0.1:8545".parse()?);
    let caja = Caja::new(CAJA, &cadena);

    let Ok(codigo) = cadena.get_code_at(CAJA).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    if codigo.is_empty() {
        eprintln!("✖ Falta el contrato de prueba. Corre antes: cargo run -q --bin errores_por_capa_p4_contrato");
        std::process::exit(1);
    }
    let saldo_antes = cadena.get_balance(origen).await?;
    println!("Envío:  retirar(500) a la Caja, que tiene un tope de 100.");
    // gas fijo: sin él, la librería simula antes de enviar y se niega a enviar algo que va a fallar.
    let pendiente = caja.retirar(U256::from(500)).gas(100_000).send().await?;
    let hash = *pendiente.tx_hash();
    let recibo = pendiente.get_receipt().await?;
    // El nodo envía status "0x0" o "0x1". alloy lo traduce a false o true.
    let status = u8::from(recibo.status());
    println!("Hash:   sí, de {} bytes. El nodo admitió la transacción.", hash.len());
    println!("Recibo: status {status} · gas usado {}", recibo.gas_used);
    let saldo_despues = cadena.get_balance(origen).await?;
    println!("Costo:  {}", if saldo_despues < saldo_antes { "el saldo de quien envía bajó: pagó comisión" } else { "ninguno" });
    println!("Estado: retirado = {}. Lo que el contrato anotó se deshizo.", caja.retirado().call().await?);

    // El recibo no trae el motivo. Una llamada simulada (eth_call) repite la ejecución sin enviar nada.
    println!("\nLa misma llamada, simulada con eth_call:");
    match caja.retirar(U256::from(500)).from(origen).call().await {
        Ok(_) => println!("  no falló"),
        Err(error) => {
            // as_error_resp() da el objeto que envió el nodo; su data trae el motivo codificado.
            let alloy::contract::Error::TransportError(transporte) = &error else { return Err(error.into()) };
            let del_nodo = transporte.as_error_resp().ok_or_else(|| eyre::eyre!("el nodo dejó de responder"))?;
            let data = del_nodo.as_revert_data().unwrap_or_default();
            println!("  code:    {}\n  message: {}", del_nodo.code, del_nodo.message);
            println!("  data:    {} y {} bytes más", hex::encode_prefixed(&data[..4]), data.len() - 4);
            let motivo = Revert::abi_decode(&data)?; // Revert es el nombre que alloy da a Error(string)
            println!("  motivo:  Error(\"{}\")", motivo.reason);
        }
    }
    println!("\n✔ Capa de ejecución: hubo hash, recibo y comisión. El status 0 dice que falló; el motivo lo da la simulación.");
    Ok(())
}
