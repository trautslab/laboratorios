// Paso 6 · La regla completa: texto → entero al entrar, enteros en el medio, texto al salir.
use alloy::network::TransactionBuilder;
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::{address, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;

const ORIGEN: Address = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // cuenta de prueba 0: Anvil firma por ella
const DESTINO: Address = address!("1111111111111111111111111111111111111111");

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);
    let Ok(antes) = cadena.get_balance(DESTINO).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };

    // 1. Al entrar: dos montos escritos por una persona pasan a enteros.
    let pagos = [parse_ether("0.1")?, parse_ether("0.2")?];
    // 2. En el medio: se suma en enteros.
    let total = pagos[0] + pagos[1];
    println!("Entrada:            \"0.1\" ETH y \"0.2\" ETH");
    println!("En enteros:         {} + {} = {total} wei", pagos[0], pagos[1]);

    let envio = TransactionRequest::default().with_from(ORIGEN).with_to(DESTINO).with_value(total);
    let recibo = cadena.send_transaction(envio).await?.get_receipt().await?;

    // Lo que quedó escrito en la cadena: el mismo entero, en hexadecimal.
    let tx: serde_json::Value = cadena.raw_request("eth_getTransactionByHash".into(), (recibo.transaction_hash,)).await?;
    let valor = tx["value"].as_str().unwrap_or_default();
    println!("En la transacción:  \"{valor}\" = {} wei", valor.parse::<U256>()?);
    let recibido = cadena.get_balance(DESTINO).await? - antes;
    println!("El destino recibió: {recibido} wei");
    // 3. Al salir: el entero se formatea solo para mostrarlo.
    let para_mostrar = format_ether(recibido);
    println!("Para mostrar:       {} ETH", para_mostrar.trim_end_matches('0').trim_end_matches('.'));
    println!("\n✔ 0.1 + 0.2 da 0.3 exacto: se sumó en wei y los decimales aparecieron al final.");
    Ok(())
}
