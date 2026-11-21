// Paso 5 · Clasificar: ante un fallo, primero averigua qué capa respondió. Después decide qué hacer.
use serde_json::{json, Value};

const CUENTA_0: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // cuentas de prueba de Anvil
const CUENTA_1: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const CAJA: &str = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35"; // donde la dejó errores_por_capa_p4_contrato
const RETIRAR_500: &str = "0xe8b1298f00000000000000000000000000000000000000000000000000000000000001f4"; // retirar(500), ya codificada
const TODO_EL_SALDO: &str = "0x21e19e0c9bab2400000"; // 10 000 ETH en wei

// Devuelve el JSON de la respuesta, o None si no respondió nadie.
async fn preguntar(method: &str, params: Value, puerto: u16) -> Option<Value> {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": params });
    let respuesta = reqwest::Client::new().post(format!("http://127.0.0.1:{puerto}")).json(&peticion).send().await.ok()?;
    respuesta.json().await.ok()
}

// Tres preguntas, en orden: ¿llegó algo?, ¿trae un error y de qué familia?, ¿qué dice el recibo?
fn clasificar(respuesta: &Option<Value>) -> (&'static str, &'static str) {
    let Some(respuesta) = respuesta else { return ("red", "reintenta: más tarde o contra otro nodo") };
    match respuesta["error"]["code"].as_i64() {
        Some(-32700 | -32600 | -32601 | -32602) => ("nodo", "corrige la petición: repetirla igual falla igual"),
        Some(-32003) => ("rechazo", "corrige los datos: monto, saldo o comisión"),
        Some(3) => ("ejecución", "no la envíes: fallaría en el contrato y pagarías comisión"),
        Some(_) => ("sin clasificar", "lee el message antes de decidir"),
        None if respuesta["result"]["status"] == "0x0" => ("ejecución", "no la reenvíes igual: ya entró en un bloque y pagó comisión"),
        None => ("ninguna", "no falló"),
    }
}

#[tokio::main]
async fn main() {
    let codigo = preguntar("eth_getCode", json!([CAJA, "latest"]), 8545).await;
    if codigo.is_none_or(|respuesta| respuesta["result"] == "0x") {
        eprintln!("✖ Falta la cadena o el contrato de prueba. Corre `npx anvil` en otra terminal y después: cargo run -q --bin errores_por_capa_p4_contrato");
        std::process::exit(1);
    }
    // Para no firmar aquí, eth_sendTransaction: Anvil guarda las llaves de sus cuentas de prueba y firma él.
    let enviada = preguntar("eth_sendTransaction", json!([{ "from": CUENTA_0, "to": CAJA, "data": RETIRAR_500, "gas": "0x186a0" }]), 8545).await;
    let hash = enviada.map(|respuesta| respuesta["result"].clone());
    let casos = [
        ("Puerto equivocado (8546)", preguntar("eth_chainId", json!([]), 8546).await),
        ("Método que no existe", preguntar("eth_noExiste", json!([]), 8545).await),
        ("Enviar todo el saldo", preguntar("eth_sendTransaction", json!([{ "from": CUENTA_1, "to": CUENTA_0, "value": TODO_EL_SALDO }]), 8545).await),
        ("Simular retirar(500)", preguntar("eth_call", json!([{ "from": CUENTA_0, "to": CAJA, "data": RETIRAR_500 }, "latest"]), 8545).await),
        ("Recibo de retirar(500), ya enviada", preguntar("eth_getTransactionReceipt", json!([hash]), 8545).await),
    ];

    for (nombre, respuesta) in &casos {
        let (capa, que_hacer) = clasificar(respuesta);
        let llego = match respuesta {
            None => "nada".to_string(),
            Some(json) if json["error"].is_object() => format!("error {} {}", json["error"]["code"], json["error"]["message"]),
            Some(json) => format!("recibo con status {}", json["result"]["status"]),
        };
        println!("{nombre}\n  llegó: {llego}\n  capa:  {capa} → {que_hacer}\n");
    }
    println!("✔ La capa decide la reacción: reintentar, corregir la petición, corregir los datos o no reenviar.");
}
