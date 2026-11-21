// Paso 3 · Calcular la comisión a mano y comprobarla contra el saldo de quien envió.
use alloy::consensus::Transaction;
use alloy::network::TransactionResponse;
use alloy::primitives::{utils::format_units, U256};
use alloy::providers::{Provider, ProviderBuilder};

const BLOQUE: u64 = 1; // el bloque donde quedó la transferencia del paso 2

// Muestra wei en otra unidad ("gwei" o "ether"), sin ceros de sobra.
fn en(unidad: &str, wei: U256) -> String {
    let texto = format_units(wei, unidad).unwrap_or_default();
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(ultimo) = cadena.get_block_number().await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    if ultimo < BLOQUE {
        eprintln!("✖ La cadena sigue en el bloque 0. Corre antes el paso 2: cargo run -q --bin gas_comision_p2");
        std::process::exit(1);
    }
    let bloque = cadena.get_block_by_number(BLOQUE.into()).full().await?.ok_or_else(|| eyre::eyre!("falta el bloque"))?;
    let tx = bloque.transactions.txns().next().ok_or_else(|| eyre::eyre!("el bloque no trae transacciones"))?;
    let recibo = cadena.get_transaction_receipt(tx.tx_hash()).await?.ok_or_else(|| eyre::eyre!("falta el recibo"))?;

    // La comisión: gas usado × precio efectivo. Todo en wei y con enteros de 256 bits.
    let comision = U256::from(recibo.gas_used) * U256::from(recibo.effective_gas_price);
    println!("Gas usado × precio efectivo: {} × {} wei", recibo.gas_used, recibo.effective_gas_price);
    println!("Comisión calculada: {comision} wei = {} gwei = {} ETH", en("gwei", comision), en("ether", comision));

    // El saldo de quien envió, justo antes y justo después de ese bloque.
    let antes = cadena.get_balance(tx.from()).number(BLOQUE - 1).await?;
    let despues = cadena.get_balance(tx.from()).number(BLOQUE).await?;
    let diferencia = antes - despues - tx.value();
    println!();
    println!("Saldo antes (bloque 0):   {} ETH", en("ether", antes));
    println!("Saldo después (bloque 1): {} ETH", en("ether", despues));
    println!("Salió de la cuenta:       {} ETH", en("ether", antes - despues));
    println!("Monto enviado:            {} ETH", en("ether", tx.value()));
    println!("Diferencia:               {diferencia} wei");
    let igual = diferencia == comision;
    println!("\n{} la comisión: gas usado × precio efectivo, wei por wei.", if igual { "✔ La diferencia es" } else { "✖ La diferencia no es" });
    Ok(())
}
