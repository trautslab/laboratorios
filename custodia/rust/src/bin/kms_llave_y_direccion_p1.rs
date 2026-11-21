// Paso 1 · Crear una llave de firma DENTRO del KMS y ponerle un nombre (alias).
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::types::{KeySpec, KeyUsageType};
use aws_sdk_kms::{Client, Config};

const ALIAS: &str = "alias/ruta-kms-llave-y-direccion";

// Si el alias ya existe, se usa esa llave. Si no, se crea una y se le pone el alias.
async fn crear_o_reutilizar(kms: &Client) -> eyre::Result<(String, &'static str)> {
    match kms.describe_key().key_id(ALIAS).send().await {
        Ok(respuesta) => {
            let llave = respuesta.key_metadata().expect("DescribeKey devuelve los datos de la llave");
            return Ok((llave.key_id().to_string(), "ya existía, se reutiliza"));
        }
        Err(error) if error.as_service_error().is_some_and(|e| e.is_not_found_exception()) => {}
        Err(error) => return Err(error.into()),
    }
    // ECC_SECG_P256K1 es secp256k1, la curva de Ethereum. SIGN_VERIFY: solo firma y verifica.
    let pedido = kms.create_key().key_spec(KeySpec::EccSecgP256K1).key_usage(KeyUsageType::SignVerify);
    let creada = pedido.description("Laboratorio: llave de un custodio").send().await?;
    let key_id = creada.key_metadata().expect("CreateKey devuelve los datos de la llave").key_id().to_string();
    kms.create_alias().alias_name(ALIAS).target_key_id(&key_id).send().await?;
    Ok((key_id, "creada ahora"))
}

#[tokio::main]
async fn main() {
    // El KMS es el emulador local. Las credenciales son ficticias y van escritas aquí a propósito:
    // así el cliente no busca las de tu máquina y el laboratorio no puede tocar una cuenta real.
    let config = Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .endpoint_url("http://localhost:4566")
        .region(Region::new("us-east-1"))
        .credentials_provider(Credentials::new("test", "test", None, None, "lab"))
        .build();
    let kms = Client::from_conf(config);

    let Ok((key_id, resultado)) = crear_o_reutilizar(&kms).await else {
        eprintln!("✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
        std::process::exit(1);
    };
    println!("KMS en http://localhost:4566 (emulador local, credenciales ficticias)\n");
    println!("Pedido: una llave ECC_SECG_P256K1 con uso SIGN_VERIFY");
    println!("≈ Resultado: {resultado}");
    println!("≈ Identificador: {key_id}");
    println!("Alias: {ALIAS}");
    println!("\n✔ La llave privada se generó dentro del servicio. Tu programa solo conoce su nombre.");
}
