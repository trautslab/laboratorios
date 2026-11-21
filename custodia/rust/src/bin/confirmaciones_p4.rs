// Paso 4 · esperar(hash, n): devolver solo cuando la transferencia tiene n confirmaciones.
use alloy::primitives::B256;
use alloy::providers::{Provider, ProviderBuilder};
use std::time::Duration;

// Mira el último bloque cuatro veces por segundo y devuelve cuando la cuenta llega a n.
async fn esperar(cadena: &impl Provider, hash: B256, n: u64) -> eyre::Result<u64> {
    let mut visto = None;
    loop {
        let recibo = cadena.get_transaction_receipt(hash).await?.ok_or_else(|| eyre::eyre!("sin recibo"))?;
        let ultimo = cadena.get_block_number().await?;
        let confirmaciones = ultimo - recibo.block_number.unwrap_or_default() + 1;
        let listo = confirmaciones >= n; // >= y no ==: entre dos miradas puede llegar más de un bloque
        if visto != Some(ultimo) {
            println!("  último bloque {ultimo}: {confirmaciones} de {n}, {}", if listo { "listo" } else { "sigo esperando" });
        }
        if listo {
            return Ok(confirmaciones);
        }
        visto = Some(ultimo);
        tokio::time::sleep(Duration::from_millis(250)).await;
    }
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
    // Cuántas confirmaciones pedir: 5, u otro número si lo pasas como argumento.
    let n: u64 = std::env::args().nth(1).and_then(|texto| texto.parse().ok()).unwrap_or(5);
    let bloque_1 = cadena.get_block_by_number(1.into()).await?.ok_or_else(|| eyre::eyre!("sin bloque 1"))?;
    let hash = bloque_1.transactions.hashes().next().ok_or_else(|| eyre::eyre!("bloque 1 vacío"))?;
    println!("Transferencia: {hash}");
    println!("Pido {n} confirmaciones.");

    let confirmaciones = esperar(&cadena, hash, n).await?;
    println!("\n✔ esperar() devolvió con {confirmaciones} confirmaciones. Antes de eso, la transferencia estaba incluida pero no contaba como hecha.");
    Ok(())
}
