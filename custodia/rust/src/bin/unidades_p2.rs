// Paso 2 · El saldo tal como llega: un entero en hexadecimal, sin punto decimal.
use alloy::primitives::U256;
use serde_json::{json, Value};

const NODO: &str = "http://127.0.0.1:8545";
const CUENTA: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // cuenta de prueba 1 de Anvil

async fn preguntar(method: &str, params: Value) -> eyre::Result<String> {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": params });
    let respuesta: Value = reqwest::Client::new().post(NODO).json(&peticion).send().await?.json().await?;
    Ok(respuesta["result"].as_str().unwrap_or_default().to_string())
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let Ok(hex) = preguntar("eth_getBalance", json!([CUENTA, "latest"])).await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    // El texto "0x…" es un entero. U256 lo lee completo, cifra por cifra.
    let wei: U256 = hex.parse()?;
    let un_eth = U256::from(10).pow(U256::from(18)); // 1 ETH = 10^18 wei
    println!("Método:      eth_getBalance");
    println!("Respuesta:   \"{hex}\"");
    println!("Como entero: {wei} wei ({} cifras)", wei.to_string().len());
    println!("1 ETH:       {un_eth} wei (un 1 y 18 ceros)");
    println!("Para ver:    {} ETH y sobran {} wei", wei / un_eth, wei % un_eth);
    println!("\n✔ La cadena guarda un entero en wei. «10000 ETH» es ese entero dividido entre 10^18.");
    Ok(())
}
