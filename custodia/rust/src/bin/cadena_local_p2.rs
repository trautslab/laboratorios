// Paso 2 · Preguntarle a la cadena «a mano»: un POST con JSON, sin ninguna librería de Ethereum.
use serde_json::{json, Value};

const NODO: &str = "http://127.0.0.1:8545";

// Toda pregunta tiene la misma forma: el nombre de un método y sus parámetros.
async fn preguntar(http: &reqwest::Client, method: &str) -> eyre::Result<String> {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": [] });
    let respuesta: Value = http.post(NODO).json(&peticion).send().await?.json().await?;
    Ok(respuesta["result"].as_str().unwrap_or_default().to_string())
}

fn a_decimal(hex: &str) -> u64 {
    u64::from_str_radix(hex.trim_start_matches("0x"), 16).unwrap_or_default()
}

#[tokio::main]
async fn main() {
    let http = reqwest::Client::new();
    let Ok(chain_id) = preguntar(&http, "eth_chainId").await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!(r#"Petición:   {{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}}"#);
    println!("Respuesta:  \"{chain_id}\"");
    println!("En decimal: {}", a_decimal(&chain_id));
    println!();
    println!("web3_clientVersion → {}", preguntar(&http, "web3_clientVersion").await.unwrap_or_default());
    let bloque = preguntar(&http, "eth_blockNumber").await.unwrap_or_default();
    println!("eth_blockNumber    → \"{bloque}\" = {}", a_decimal(&bloque));
    println!("\n✔ La cadena es un servicio HTTP: le preguntas con JSON y responde con JSON.");
}
