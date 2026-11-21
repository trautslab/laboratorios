// Paso 2 · Capa de nodo: el nodo responde, y su respuesta es un error con code y message.
use serde_json::Value;

const NODO: &str = "http://127.0.0.1:8545";

// Envía el cuerpo tal cual y devuelve el estado HTTP y el JSON de la respuesta.
async fn enviar(http: &reqwest::Client, cuerpo: &'static str) -> reqwest::Result<(u16, Value)> {
    let respuesta = http.post(NODO).header("content-type", "application/json").body(cuerpo).send().await?;
    Ok((respuesta.status().as_u16(), respuesta.json().await?))
}

const CASOS: [(&str, &str); 4] = [
    ("Pregunta correcta", r#"{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}"#),
    ("Método que no existe", r#"{"jsonrpc":"2.0","id":1,"method":"eth_noExiste","params":[]}"#),
    ("Parámetro mal formado", r#"{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["hola","latest"]}"#),
    ("JSON cortado", r#"{"jsonrpc":"2.0","id":1,"method":"#),
];

#[tokio::main]
async fn main() {
    let http = reqwest::Client::new();
    for (nombre, cuerpo) in CASOS {
        let Ok((estado, json)) = enviar(&http, cuerpo).await else {
            eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
            std::process::exit(1);
        };
        println!("{nombre}\n  envío:    {cuerpo}");
        let error = &json["error"];
        if error.is_object() {
            println!("  HTTP {estado} · error.code {} · error.message {}\n", error["code"], error["message"]);
        } else {
            println!("  HTTP {estado} · result {}\n", json["result"]);
        }
    }
    println!("✔ Capa de nodo: el HTTP dice 200 las cuatro veces. El error viaja dentro del JSON.");
}
