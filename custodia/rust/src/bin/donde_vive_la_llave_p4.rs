// Paso 4 · Un KMS: la llave se crea dentro del servicio y no sale. Tu programa guarda un permiso.
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::types::{KeyMetadata, KeySpec, KeyUsageType};
use aws_sdk_kms::{Client, Config};
use serde_json::{json, Value};

const KMS: &str = "http://localhost:4566"; // Floci, el emulador local
const ALIAS: &str = "alias/ruta-donde-vive-la-llave";

// Si el alias ya apunta a una llave, se usa esa. Si no, el servicio crea una: tú no le envías ninguna.
async fn llave_del_alias(kms: &Client) -> eyre::Result<(KeyMetadata, &'static str)> {
    match kms.describe_key().key_id(ALIAS).send().await {
        Ok(respuesta) => Ok((respuesta.key_metadata.ok_or_else(|| eyre::eyre!("sin metadatos"))?, "ya existía")),
        Err(error) if error.as_service_error().is_some_and(|servicio| servicio.is_not_found_exception()) => {
            let creada = kms.create_key().key_spec(KeySpec::EccSecgP256K1).key_usage(KeyUsageType::SignVerify).send().await?;
            let llave = creada.key_metadata.ok_or_else(|| eyre::eyre!("sin metadatos"))?;
            kms.create_alias().alias_name(ALIAS).target_key_id(&llave.key_id).send().await?;
            Ok((llave, "creada ahora"))
        }
        Err(error) => Err(error.into()),
    }
}

async fn paso(kms: &Client) -> eyre::Result<()> {
    let (llave, origen) = llave_del_alias(kms).await?;
    println!("Lugar 4 · un KMS (emulador local en {KMS})");
    println!("  Alias:   {ALIAS}");
    println!("≈ Id de la llave: {} ({origen})", llave.key_id);
    let texto = |valor: Option<&str>| valor.unwrap_or("?").to_string();
    println!("  KeySpec: {} · KeyUsage: {} · Origin: {}", texto(llave.key_spec.as_ref().map(|v| v.as_str())), texto(llave.key_usage.as_ref().map(|v| v.as_str())), texto(llave.origin.as_ref().map(|v| v.as_str())));

    // Lo que la API entrega de la llave: la mitad pública.
    let publica = kms.get_public_key().key_id(ALIAS).send().await?.public_key.ok_or_else(|| eyre::eyre!("sin llave pública"))?;
    println!("\nPedirle la llave al servicio");
    println!("  GetPublicKey: {} bytes en formato DER, la mitad pública", publica.as_ref().len());
    println!("≈ Pública: 0x{}", hex::encode(publica.as_ref()));
    // El SDK no trae ninguna operación para la mitad privada. Se pide a mano, con un nombre inventado.
    let peticion = reqwest::Client::new().post(KMS).header("content-type", "application/x-amz-json-1.1").header("x-amz-target", "TrentService.GetPrivateKey");
    let respuesta = peticion.body(json!({ "KeyId": ALIAS }).to_string()).send().await?;
    let (estado, cuerpo) = (respuesta.status().as_u16(), respuesta.json::<Value>().await?);
    println!("  GetPrivateKey: HTTP {estado} · {} · {}", cuerpo["__type"].as_str().unwrap_or("?"), cuerpo["message"].as_str().unwrap_or("?"));

    println!("\nDónde está la llave");
    println!("  En tu disco: en ningún archivo.");
    println!("  En la memoria del programa: nunca. Tiene un alias y unas credenciales.");
    println!("✔ KMS: la llave se creó dentro del servicio. Tu programa guarda un permiso para usarla, no la llave.");
    Ok(())
}

#[tokio::main]
async fn main() {
    // Credenciales FICTICIAS escritas aquí a propósito: el cliente nunca mira las de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let configuracion = Config::builder().behavior_version(BehaviorVersion::latest()).region(Region::new("us-east-1")).credentials_provider(credenciales).endpoint_url(KMS);
    if let Err(error) = paso(&Client::from_conf(configuracion.build())).await {
        eprintln!("✖ El KMS local no respondió ({error}). Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
        std::process::exit(1);
    }
}
