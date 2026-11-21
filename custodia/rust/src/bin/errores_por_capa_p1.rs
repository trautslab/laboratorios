// Paso 1 · Capa de red: con la cadena apagada, la pregunta no llega a nadie. No hay JSON que leer.
use serde_json::json;
use std::error::Error;

const NODO: &str = "http://127.0.0.1:8545";

// El motivo real está al fondo de las causas del error: un error del sistema operativo.
fn conexion_rechazada(error: &reqwest::Error) -> bool {
    let mut causa: Option<&dyn Error> = Some(error);
    while let Some(actual) = causa {
        if let Some(del_sistema) = actual.downcast_ref::<std::io::Error>() {
            return del_sistema.kind() == std::io::ErrorKind::ConnectionRefused;
        }
        causa = actual.source();
    }
    false
}

#[tokio::main]
async fn main() {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": [] });

    println!("POST {NODO} · eth_chainId");
    match reqwest::Client::new().post(NODO).json(&peticion).send().await {
        // Si llegas aquí, alguien respondió: para este paso la cadena tiene que estar apagada.
        Ok(respuesta) => {
            eprintln!("✖ Alguien respondió (HTTP {}). Cierra Anvil con Ctrl+C y repite este paso.", respuesta.status().as_u16());
            std::process::exit(1);
        }
        // send() no devuelve una respuesta: devuelve un error de transporte.
        Err(error) => {
            let rechazada = conexion_rechazada(&error);
            println!("Respuesta HTTP: ninguna");
            println!("JSON del nodo:  ninguno (no hay code ni message)");
            println!("Motivo:         {}", if rechazada { "conexión rechazada, nadie escucha en ese puerto" } else { "la conexión no se completó" });
            println!("\n✔ Capa de red: la pregunta no llegó a ningún nodo. El fallo lo detectó tu propia máquina.");
        }
    }
}
