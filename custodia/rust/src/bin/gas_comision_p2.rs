// Paso 2 · Una transferencia con el precio del gas escrito a mano: un techo y una propina.
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, utils::{format_units, parse_ether}, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

const GWEI: u128 = 1_000_000_000; // 1 gwei = 10^9 wei

// Muestra una cantidad de wei en gwei, sin ceros de sobra: 1000000000 → "1".
fn gwei(wei: U256) -> String {
    let texto = format_units(wei, "gwei").unwrap_or_default();
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
    let cuenta0: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let cadena = ProviderBuilder::new().wallet(cuenta0).connect_http("http://127.0.0.1:8545".parse()?);

    let tx = TransactionRequest::default()
        .with_to(address!("70997970C51812dc3A010C7d01b50e0d17dc79C8")) // cuenta de prueba 1
        .with_value(parse_ether("1")?)
        .with_max_fee_per_gas(5 * GWEI) // techo: lo máximo que aceptas pagar por unidad de gas
        .with_max_priority_fee_per_gas(2 * GWEI); // propina: lo que ofreces a quien produce el bloque
    let Ok(enviada) = cadena.send_transaction(tx).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    let recibo = enviada.get_receipt().await?;
    let numero = recibo.block_number.unwrap_or_default();
    let bloque = cadena.get_block_by_number(numero.into()).await?.ok_or_else(|| eyre::eyre!("falta el bloque"))?;

    println!("Enviado: 1 ETH de la cuenta 0 a la cuenta 1");
    println!("Techo   (maxFeePerGas):         5 gwei");
    println!("Propina (maxPriorityFeePerGas): 2 gwei");
    println!();
    println!("Incluida en el bloque: {numero}");
    println!("Base fee de ese bloque: {} gwei", gwei(U256::from(bloque.header.base_fee_per_gas.unwrap_or_default())));
    println!("Gas usado (gasUsed): {}", recibo.gas_used);
    println!("Precio efectivo (effectiveGasPrice): {} wei = {} gwei", recibo.effective_gas_price, gwei(U256::from(recibo.effective_gas_price)));
    println!("\n✔ El recibo trae las dos cifras de la comisión: cuánto gas se usó y a qué precio.");
    Ok(())
}
