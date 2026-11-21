// Paso 5 · El techo no es el precio: la misma transferencia con tres techos distintos.
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, utils::{format_units, parse_ether, parse_units}, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

// De gwei (texto) a wei, y de wei a gwei sin ceros de sobra.
fn wei(gwei: &str) -> U256 {
    parse_units(gwei, "gwei").map(|cantidad| cantidad.get_absolute()).unwrap_or_default()
}
fn gwei(wei: U256) -> String {
    let texto = format_units(wei, "gwei").unwrap_or_default();
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

// La misma transferencia de 1 ETH; solo cambian el techo y la propina (en gwei).
fn transferencia(techo: &str, propina: &str) -> TransactionRequest {
    TransactionRequest::default()
        .with_to(address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"))
        .with_value(parse_ether("1").unwrap_or_default())
        .with_max_fee_per_gas(wei(techo).to())
        .with_max_priority_fee_per_gas(wei(propina).to())
}

// Envía la transferencia y muestra qué se cobró de verdad.
async fn enviar(cadena: &impl Provider, techo: &str, propina: &str) -> eyre::Result<()> {
    let recibo = cadena.send_transaction(transferencia(techo, propina)).await?.get_receipt().await?;
    let numero = recibo.block_number.unwrap_or_default();
    let bloque = cadena.get_block_by_number(numero.into()).await?.ok_or_else(|| eyre::eyre!("falta el bloque"))?;
    let base = U256::from(bloque.header.base_fee_per_gas.unwrap_or_default());
    let efectivo = U256::from(recibo.effective_gas_price);
    let gas = U256::from(recibo.gas_used);
    println!("Techo {techo} gwei, propina {propina} gwei → bloque {numero}");
    println!("  Base fee del bloque:        {} gwei", gwei(base));
    println!("  Base fee + propina pedida:  {} gwei", gwei(base + wei(propina)));
    println!("  Precio efectivo:            {} gwei", gwei(efectivo));
    println!("  Propina que se cobró:       {} gwei", gwei(efectivo - base));
    println!("  Comisión pagada:            {} gwei", gwei(gas * efectivo));
    println!("  Techo × gas usado:          {} gwei", gwei(gas * wei(techo)));
    Ok(())
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
    let cuenta0: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let cadena = ProviderBuilder::new().wallet(cuenta0).connect_http("http://127.0.0.1:8545".parse()?);

    if enviar(&cadena, "500", "2").await.is_err() { // techo muy por encima de base fee + propina
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }
    println!();
    enviar(&cadena, "2.5", "2").await?; // techo entre la base fee y base fee + propina
    println!();
    // Techo por debajo de la base fee: la cadena no acepta la transacción.
    let motivo = match cadena.send_transaction(transferencia("0.5", "0.1")).await {
        Err(error) => error.as_error_resp().map(|respuesta| respuesta.message.to_string()).unwrap_or_default(),
        Ok(_) => "no fue rechazada".to_string(),
    };
    println!("Techo 0.5 gwei, propina 0.1 gwei → rechazada: {motivo}");
    println!("\n✔ Pagas base fee del bloque + propina, nunca más que el techo. El techo no es el precio.");
    Ok(())
}
