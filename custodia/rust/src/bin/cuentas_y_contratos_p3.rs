// Paso 3 · Una dirección que nadie usó: la cadena responde igual, con todo en cero.
use serde_json::json;

const NODO: &str = "http://127.0.0.1:8545";
const INVENTADA: &str = "0x1234567890123456789012345678901234567890"; // 40 dígitos tecleados sin pensar

// A mano, para ver la respuesta tal cual llega. «latest» pide el estado más reciente.
async fn preguntar(http: &reqwest::Client, method: &str) -> eyre::Result<String> {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": [INVENTADA, "latest"] });
    let respuesta = http.post(NODO).json(&peticion).send().await?;
    Ok(respuesta.text().await?)
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let http = reqwest::Client::new();
    let Ok(saldo) = preguntar(&http, "eth_getBalance").await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("Dirección inventada: {INVENTADA}\n");
    println!("eth_getBalance          → {saldo}");
    println!("eth_getTransactionCount → {}", preguntar(&http, "eth_getTransactionCount").await?);
    println!("eth_getCode             → {}", preguntar(&http, "eth_getCode").await?);
    println!("\n✔ Ningún error: saldo 0x0, nonce 0x0 y código 0x. Una dirección no se «crea» para existir.");
    Ok(())
}
