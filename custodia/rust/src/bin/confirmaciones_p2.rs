// Paso 2 · Una transferencia queda incluida en un bloque. Ese bloque es su primera confirmación.
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, utils::parse_ether};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
    let cuenta: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let cadena = ProviderBuilder::new().wallet(cuenta).connect_http("http://127.0.0.1:8545".parse()?);

    // 1 ETH a la cuenta de prueba 1. Gas y comisión fijos: en una cadena recién arrancada el hash sale siempre igual.
    let transferencia = TransactionRequest::default()
        .with_to(address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"))
        .with_value(parse_ether("1")?)
        .with_gas_limit(21_000)
        .with_max_fee_per_gas(2_000_000_000)
        .with_max_priority_fee_per_gas(1_000_000_000);
    let Ok(enviada) = cadena.send_transaction(transferencia).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    let recibo = enviada.get_receipt().await?;
    let bloque = recibo.block_number.unwrap_or_default();
    let ultimo = cadena.get_block_number().await?;

    println!("Transferencia: {}", recibo.transaction_hash);
    println!("Incluida en el bloque: {bloque}");
    println!("Último bloque:         {ultimo}");
    // Confirmaciones = último bloque - bloque de la transacción + 1.
    println!("Confirmaciones:        {ultimo} - {bloque} + 1 = {}", ultimo - bloque + 1);
    println!("\n✔ La transferencia está incluida: tiene 1 confirmación. Todavía no tiene ningún bloque encima.");
    Ok(())
}
