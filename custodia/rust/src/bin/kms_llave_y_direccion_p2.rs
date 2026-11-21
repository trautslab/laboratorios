// Paso 2 · Preguntarle al KMS qué sabe de la llave. Responde con datos SOBRE ella, no con ella.
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::{Client, Config};

const ALIAS: &str = "alias/ruta-kms-llave-y-direccion";

#[tokio::main]
async fn main() {
    // Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
    let config = Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .endpoint_url("http://localhost:4566")
        .region(Region::new("us-east-1"))
        .credentials_provider(Credentials::new("test", "test", None, None, "lab"))
        .build();
    let kms = Client::from_conf(config);

    // El alias sirve de identificador en cualquier operación: no hace falta guardar el KeyId.
    let respuesta = match kms.describe_key().key_id(ALIAS).send().await {
        Ok(respuesta) => respuesta,
        Err(error) if error.as_service_error().is_some_and(|e| e.is_not_found_exception()) => {
            eprintln!("✖ No existe {ALIAS}. Corre antes el paso 1: cargo run -q --bin kms_llave_y_direccion_p1");
            std::process::exit(1);
        }
        Err(_) => {
            eprintln!("✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
            std::process::exit(1);
        }
    };
    let llave = respuesta.key_metadata().expect("DescribeKey devuelve los datos de la llave");
    let algoritmos: Vec<&str> = llave.signing_algorithms().iter().map(|a| a.as_str()).collect();

    println!("DescribeKey {ALIAS}\n");
    println!("≈ KeyId: {}", llave.key_id());
    println!("≈ Arn: {}", llave.arn().unwrap_or_default());
    println!("KeySpec: {}", llave.key_spec().map(|v| v.as_str()).unwrap_or_default());
    println!("KeyUsage: {}", llave.key_usage().map(|v| v.as_str()).unwrap_or_default());
    println!("SigningAlgorithms: {}", algoritmos.join(", "));
    println!("KeyState: {}", llave.key_state().map(|v| v.as_str()).unwrap_or_default());
    println!("Origin: {}", llave.origin().map(|v| v.as_str()).unwrap_or_default());
    println!("KeyManager: {}", llave.key_manager().map(|v| v.as_str()).unwrap_or_default());
    println!("\n✔ Curva, uso, algoritmo y estado. La llave privada no viene en la respuesta.");
}
