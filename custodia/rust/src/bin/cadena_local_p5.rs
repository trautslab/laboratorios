// Paso 5 · Los bloques: esta cadena solo avanza cuando pasa algo, y vive en memoria.
use alloy::providers::{Provider, ProviderBuilder};
use std::time::Duration;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(ahora) = cadena.get_block_number().await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("Bloque ahora:               {ahora}");
    tokio::time::sleep(Duration::from_secs(3)).await;
    println!("Tres segundos después:      {}", cadena.get_block_number().await?);

    // anvil_mine es un método propio de Anvil: produce bloques a pedido. No existe en una red real.
    cadena.raw_request::<_, ()>("anvil_mine".into(), ("0x1",)).await?;
    println!("Después de pedir un bloque: {}", cadena.get_block_number().await?);
    println!("\n✔ Sin transacciones no hay bloques nuevos. Y todo esto vive en la memoria de Anvil.");
    Ok(())
}
