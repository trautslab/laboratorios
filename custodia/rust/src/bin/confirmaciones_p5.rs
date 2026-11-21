// Paso 5 · Otra forma de preguntar: en vez de contar bloques, pedir el bloque latest, safe o finalized.
use alloy::eips::BlockNumberOrTag;
use alloy::providers::{Provider, ProviderBuilder};

// Pide un bloque por etiqueta y devuelve su número. Por dentro: eth_getBlockByNumber("safe", false).
async fn numero_de(cadena: &impl Provider, etiqueta: BlockNumberOrTag) -> eyre::Result<u64> {
    let bloque = cadena.get_block_by_number(etiqueta).await?.ok_or_else(|| eyre::eyre!("sin bloque"))?;
    Ok(bloque.header.number)
}

async fn mostrar(cadena: &impl Provider, bloque_de_la_transferencia: u64) -> eyre::Result<()> {
    println!("  latest    → bloque {}", numero_de(cadena, BlockNumberOrTag::Latest).await?);
    println!("  safe      → bloque {}", numero_de(cadena, BlockNumberOrTag::Safe).await?);
    let finalizado = numero_de(cadena, BlockNumberOrTag::Finalized).await?;
    println!("  finalized → bloque {finalizado}");
    // La regla por etiqueta: la transferencia cuenta cuando su bloque no supera al bloque finalized.
    let respuesta = if bloque_de_la_transferencia <= finalizado { "sí" } else { "no" };
    println!("  El bloque {bloque_de_la_transferencia} ya está finalizado: {respuesta}");
    Ok(())
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
    let bloque_1 = cadena.get_block_by_number(1.into()).await?.ok_or_else(|| eyre::eyre!("sin bloque 1"))?;
    let hash = bloque_1.transactions.hashes().next().ok_or_else(|| eyre::eyre!("bloque 1 vacío"))?;
    let recibo = cadena.get_transaction_receipt(hash).await?.ok_or_else(|| eyre::eyre!("sin recibo"))?;
    let bloque = recibo.block_number.unwrap_or_default();
    println!("La transferencia está en el bloque {bloque}.\n");

    println!("Ahora:");
    mostrar(&cadena, bloque).await?;

    // 64 bloques de una vez ("0x40" es 64 en hexadecimal).
    cadena.raw_request::<_, ()>("anvil_mine".into(), ("0x40",)).await?;
    println!("\nanvil_mine: pedí 64 bloques\n");

    println!("Después:");
    mostrar(&cadena, bloque).await?;
    println!("\n✔ Anvil calcula safe y finalized restando 32 y 64 bloques a latest. En una red real los decide el consenso.");
    Ok(())
}
