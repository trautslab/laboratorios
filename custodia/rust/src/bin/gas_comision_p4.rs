// Paso 4 · Seguir el dinero: qué parte de la comisión recibe alguien y qué parte no recibe nadie.
use alloy::consensus::Transaction;
use alloy::network::TransactionResponse;
use alloy::primitives::{utils::format_units, Address, I256, U256};
use alloy::providers::{Provider, ProviderBuilder};

const BLOQUE: u64 = 1; // el bloque donde quedó la transferencia del paso 2

// Muestra wei en otra unidad ("gwei" o "ether"), sin ceros de sobra.
fn en(unidad: &str, wei: U256) -> String {
    let texto = format_units(wei, unidad).unwrap_or_default();
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}
fn con_signo(wei: I256) -> String {
    format!("{}{} ETH", if wei.is_negative() { '-' } else { '+' }, en("ether", wei.unsigned_abs()))
}

// Cuánto cambió el saldo de una dirección al pasar del bloque 0 al bloque 1, en wei.
async fn cambio(cadena: &impl Provider, direccion: Address) -> eyre::Result<I256> {
    let antes = cadena.get_balance(direccion).number(BLOQUE - 1).await?;
    let despues = cadena.get_balance(direccion).number(BLOQUE).await?;
    Ok(I256::from_raw(despues) - I256::from_raw(antes))
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

    // El precio efectivo tiene dos partes: la base fee del bloque y la propina.
    let efectivo = U256::from(recibo.effective_gas_price);
    let base = U256::from(bloque.header.base_fee_per_gas.unwrap_or_default());
    let propina = efectivo - base;
    let gas = U256::from(recibo.gas_used);
    println!("Precio efectivo: {} gwei = {} gwei de base fee + {} gwei de propina", en("gwei", efectivo), en("gwei", base), en("gwei", propina));
    println!("Productor del bloque (miner): {}", bloque.header.beneficiary);

    let envia = cambio(&cadena, tx.from()).await?;
    let recibe = cambio(&cadena, tx.to().unwrap_or_default()).await?;
    let productor = cambio(&cadena, bloque.header.beneficiary).await?;
    println!("\nCambio de saldo entre el bloque 0 y el bloque 1:");
    println!("  Quien envía:  {}", con_signo(envia));
    println!("  Quien recibe: {}", con_signo(recibe));
    println!("  Productor:    {}", con_signo(productor));
    println!("  Suma:         {}", con_signo(envia + recibe + productor));
    println!();
    println!("Propina × gas:  {} gwei × {gas} = {} ETH", en("gwei", propina), en("ether", propina * gas));
    println!("Base fee × gas: {} gwei × {gas} = {} ETH", en("gwei", base), en("ether", base * gas));
    println!("\n✔ La propina está en el saldo del productor. La base fee no está en ningún saldo: se quemó.");
    Ok(())
}
