// Paso 1 · La base fee: el precio mínimo de cada unidad de gas, escrito en cada bloque.
use alloy::eips::BlockNumberOrTag;
use alloy::primitives::{utils::format_units, U256};
use alloy::providers::{Provider, ProviderBuilder};

// Muestra una cantidad de wei en gwei, sin ceros de sobra: 1000000000 → "1".
fn gwei(wei: U256) -> String {
    let texto = format_units(wei, "gwei").unwrap_or_default();
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(Some(bloque)) = cadena.get_block_by_number(BlockNumberOrTag::Latest).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }; // por dentro: eth_getBlockByNumber
    let base = bloque.header.base_fee_per_gas.unwrap_or_default();
    println!("Último bloque: {}", bloque.header.number);
    println!("Base fee (baseFeePerGas): {base} wei = {} gwei", gwei(U256::from(base)));
    println!("Gas usado en el bloque: {} de {}", bloque.header.gas_used, bloque.header.gas_limit);
    println!("\n✔ La base fee no la eliges tú: viene escrita en el bloque, en wei por unidad de gas.");
    Ok(())
}
