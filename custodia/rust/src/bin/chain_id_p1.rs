// Pasos 1 y 3 · La misma llave en la red que esté escuchando en el puerto 8545.
use alloy::primitives::utils::format_ether;
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::PrivateKeySigner;

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
const LLAVE: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let red = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    // La dirección se calcula a partir de la llave: en esta línea no interviene ninguna red.
    let cuenta: PrivateKeySigner = LLAVE.parse()?;
    // Lo demás se le pregunta a la red: quién es, y qué sabe de esa dirección.
    let Ok(chain_id) = red.get_chain_id().await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    let saldo = format_ether(red.get_balance(cuenta.address()).await?);
    let nonce = red.get_transaction_count(cuenta.address()).await?;
    println!("Red:       chain id {chain_id}");
    println!("Dirección: {}", cuenta.address());
    println!("Saldo:     {} ETH", saldo.trim_end_matches('0').trim_end_matches('.'));
    println!("Nonce:     {nonce}");
    println!("\n✔ La dirección sale de la llave. El chain id, el saldo y el nonce los responde cada red.");
    Ok(())
}
