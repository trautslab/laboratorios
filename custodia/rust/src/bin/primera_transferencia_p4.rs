// Paso 4 · El recibo: la respuesta de la cadena a «¿qué pasó con este hash?».
use alloy::primitives::TxHash;
use alloy::providers::{Provider, ProviderBuilder};

const INVENTADO: TxHash = TxHash::repeat_byte(0xab); // tiene forma de hash, pero nadie envió esa transacción

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Some(hash) = std::env::args().nth(1).and_then(|texto| texto.parse::<TxHash>().ok()) else {
        eprintln!("✖ Falta el hash del paso 3. Uso: cargo run -q --bin primera_transferencia_p4 -- 0x…");
        std::process::exit(1);
    };

    // El nodo responde null cuando no tiene recibo. alloy lo entrega como None.
    let Ok(recibo) = cadena.get_transaction_receipt(hash).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }; // por dentro: eth_getTransactionReceipt
    let Some(recibo) = recibo else {
        eprintln!("✖ La cadena no tiene recibo para {hash}. Repite el paso 3 y copia el hash que imprime.");
        std::process::exit(1);
    };
    println!("Recibo de {hash}");
    println!("  status:      {}", if recibo.status() { "1 (éxito)" } else { "0 (falló)" });
    println!("  blockNumber: {}", recibo.block_number.unwrap_or_default());
    println!("  from:        {}", recibo.from);
    println!("  to:          {}", recibo.to.unwrap_or_default());
    println!("  gasUsed:     {}", recibo.gas_used);
    let inventado = cadena.get_transaction_receipt(INVENTADO).await?;
    println!("\nRecibo de un hash inventado: {}", if inventado.is_none() { "null" } else { "existe" });
    println!("\n✔ Con recibo y status 1, la transferencia ocurrió. Sin recibo, un hash no prueba nada.");
    Ok(())
}
