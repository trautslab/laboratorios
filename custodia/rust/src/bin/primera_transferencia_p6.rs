// Paso 6 · El cambio de estado: los saldos justo antes y justo después del bloque del recibo.
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
        eprintln!("✖ Falta el hash del paso 3. Uso: cargo run -q --bin primera_transferencia_p6 -- 0x…");
        std::process::exit(1);
    };

    let Ok(recibo) = cadena.get_transaction_receipt(hash).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    let Some(recibo) = recibo else {
        eprintln!("✖ La cadena no tiene recibo para {hash}. Repite el paso 3 y copia el hash que imprime.");
        std::process::exit(1);
    };
    let bloque = recibo.block_number.unwrap_or_default();
    let (envia, recibe) = (recibo.from, recibo.to.unwrap_or_default());
    println!("El recibo dice: bloque {bloque}\n");

    // El mismo eth_getBalance de siempre, con un segundo parámetro: en qué bloque mirar.
    let envia_antes = cadena.get_balance(envia).number(bloque - 1).await?;
    let envia_despues = cadena.get_balance(envia).number(bloque).await?;
    let recibe_antes = cadena.get_balance(recibe).number(bloque - 1).await?;
    let recibe_despues = cadena.get_balance(recibe).number(bloque).await?;

    println!("Quien envía");
    println!("  antes (bloque {}):   {} ETH", bloque - 1, en_eth(envia_antes));
    println!("  después (bloque {bloque}): {} ETH", en_eth(envia_despues));
    println!("  salió:              {} ETH", en_eth(envia_antes - envia_despues));
    println!("Quien recibe");
    println!("  antes (bloque {}):   {} ETH", bloque - 1, en_eth(recibe_antes));
    println!("  después (bloque {bloque}): {} ETH", en_eth(recibe_despues));
    println!("  entró:              {} ETH", en_eth(recibe_despues - recibe_antes));

    let comision = envia_antes - envia_despues - (recibe_despues - recibe_antes);
    println!("\nComisión (salió y no llegó): {} ETH", en_eth(comision));
    println!("\n✔ La transferencia cambió el estado: 1 ETH cambió de cuenta y quien envía pagó la comisión.");
    Ok(())
}
