// Paso 3 · La misma pregunta con una librería: alloy arma el JSON y convierte la respuesta.
use alloy::providers::{Provider, ProviderBuilder};

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let (Ok(chain_id), Ok(bloque)) = (cadena.get_chain_id().await, cadena.get_block_number().await) else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("Chain id:      {chain_id}"); // por dentro: eth_chainId
    println!("Bloque actual: {bloque}"); // por dentro: eth_blockNumber
    println!("\n✔ Mismas respuestas que a mano, ya convertidas a números.");
    Ok(())
}
