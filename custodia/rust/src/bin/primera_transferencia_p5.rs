// Paso 5 · Transacción y recibo: dos preguntas distintas con el mismo hash.
use alloy::consensus::Transaction;
use alloy::primitives::{utils::format_ether, TxHash, U256};
use alloy::providers::{Provider, ProviderBuilder};

// format_ether devuelve siempre 18 decimales; aquí se quitan los ceros del final.
fn en_eth(wei: U256) -> String {
    format_ether(wei).trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Some(hash) = std::env::args().nth(1).and_then(|texto| texto.parse::<TxHash>().ok()) else {
        eprintln!("✖ Falta el hash del paso 3. Uso: cargo run -q --bin primera_transferencia_p5 -- 0x…");
        std::process::exit(1);
    };

    let Ok(tx) = cadena.get_transaction_by_hash(hash).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }; // por dentro: eth_getTransactionByHash
    let recibo = cadena.get_transaction_receipt(hash).await?; // por dentro: eth_getTransactionReceipt
    let (Some(tx), Some(recibo)) = (tx, recibo) else {
        eprintln!("✖ La cadena no conoce {hash}. Repite el paso 3 y copia el hash que imprime.");
        std::process::exit(1);
    };

    println!("La transacción: lo que se firmó y se envió");
    println!("  from:  {}", tx.inner.signer());
    println!("  to:    {}", tx.to().unwrap_or_default());
    println!("  value: {} wei = {} ETH", tx.value(), en_eth(tx.value()));
    println!("  r:     {:#x}", tx.inner.signature().r());
    println!("  s:     {:#x}", tx.inner.signature().s());

    println!("\nEl recibo: lo que la cadena hizo con ella");
    println!("  status:      {}", if recibo.status() { "1 (éxito)" } else { "0 (falló)" });
    println!("  blockNumber: {}", recibo.block_number.unwrap_or_default());
    println!("  gasUsed:     {}", recibo.gas_used);
    println!("\n✔ El monto y la firma están en la transacción; el resultado y el bloque, en el recibo.");
    Ok(())
}
