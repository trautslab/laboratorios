// Paso 3 · Cada bloque nuevo es una confirmación más de la misma transferencia.
use alloy::primitives::B256;
use alloy::providers::{Provider, ProviderBuilder};

// Confirmaciones = último bloque - bloque de la transacción + 1.
async fn contar(cadena: &impl Provider, hash: B256) -> eyre::Result<(u64, u64, u64)> {
    let recibo = cadena.get_transaction_receipt(hash).await?.ok_or_else(|| eyre::eyre!("sin recibo"))?; // por dentro: eth_getTransactionReceipt
    let bloque = recibo.block_number.unwrap_or_default();
    let ultimo = cadena.get_block_number().await?; // por dentro: eth_blockNumber
    Ok((bloque, ultimo, ultimo - bloque + 1))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(altura) = cadena.get_block_number().await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    if altura == 0 {
        eprintln!("✖ La cadena está en el bloque 0. Corre antes el paso 2: cargo run -q --bin confirmaciones_p2");
        std::process::exit(1);
    }
    // La transferencia del paso 2 es la primera transacción del bloque 1. Un sistema real guarda el hash al enviarla.
    let bloque_1 = cadena.get_block_by_number(1.into()).await?.ok_or_else(|| eyre::eyre!("sin bloque 1"))?;
    let hash = bloque_1.transactions.hashes().next().ok_or_else(|| eyre::eyre!("bloque 1 vacío"))?;
    let (_, ultimo, confirmaciones) = contar(&cadena, hash).await?;
    println!("Transferencia: {hash}");
    println!("Antes:   último bloque {ultimo}, confirmaciones: {confirmaciones}");

    // anvil_mine es un método propio de Anvil: produce bloques a pedido. Aquí, uno, y va vacío.
    cadena.raw_request::<_, ()>("anvil_mine".into(), ("0x1",)).await?;
    println!("anvil_mine: pedí un bloque");

    let (bloque, ultimo, confirmaciones) = contar(&cadena, hash).await?;
    println!("Después: último bloque {ultimo}, confirmaciones: {confirmaciones}");
    println!("\n✔ La transferencia sigue en el bloque {bloque}. Lo que creció es la cadena encima de ella.");
    Ok(())
}
