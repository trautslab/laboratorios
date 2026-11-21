// Paso 2 · El estado antes: cuánto tiene quien envía y cuánto quien recibe.
use alloy::primitives::{address, utils::format_ether, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};

const ORIGEN: Address = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // cuenta de prueba 0 de Anvil
const DESTINO: Address = address!("40596E1B9B0032595240d85AC2Cf9e6b83041399"); // una dirección que nadie usó en esta cadena

// format_ether devuelve siempre 18 decimales; aquí se quitan los ceros del final.
fn en_eth(wei: U256) -> String {
    format_ether(wei).trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(bloque) = cadena.get_block_number().await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("Bloque actual: {bloque}");
    let origen = cadena.get_balance(ORIGEN).await?; // por dentro: eth_getBalance
    let destino = cadena.get_balance(DESTINO).await?;
    println!("Quien envía  ({ORIGEN}): {} ETH", en_eth(origen));
    println!("Quien recibe ({DESTINO}): {} ETH", en_eth(destino));
    println!("\n✔ Este es el estado de la cadena antes de la transferencia.");
    Ok(())
}
