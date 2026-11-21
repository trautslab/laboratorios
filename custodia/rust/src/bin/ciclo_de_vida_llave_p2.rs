// Paso 2 · Deshabilitar: la firma se detiene de inmediato y se puede volver atrás.
use alloy::primitives::{keccak256, utils::format_ether, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::error::ProvideErrorMetadata;
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::Client;

const ALIAS: &str = "alias/ruta-ciclo-de-vida-llave";
const RPC: &str = "http://127.0.0.1:8545";

fn salir(texto: &str) -> ! {
    eprintln!("✖ {texto}");
    std::process::exit(1)
}

fn en_eth(wei: U256) -> String {
    let texto = format_ether(wei);
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

// Dirección de una llave del KMS. Se explica en «Crear una llave en KMS y obtener su dirección».
async fn direccion_de(kms: &Client, llave: &str) -> eyre::Result<Address> {
    let respuesta = kms.get_public_key().key_id(llave).send().await?;
    let der = respuesta.public_key().ok_or_else(|| eyre::eyre!("sin llave pública"))?.as_ref();
    Ok(Address::from_slice(&keccak256(&der[der.len() - 64..])[12..]))
}

async fn estado_de(kms: &Client, llave: &str) -> eyre::Result<String> {
    let respuesta = kms.describe_key().key_id(llave).send().await?;
    Ok(respuesta.key_metadata().and_then(|m| m.key_state()).map(|e| e.as_str().to_string()).unwrap_or_default())
}

// Pide una firma de 32 bytes y muestra lo que respondió el servicio: la firma o el rechazo.
async fn probar_firma(kms: &Client, llave: &str, nombre: &str) {
    let pedido = kms.sign().key_id(llave).message(Blob::new([1u8; 32])).message_type(MessageType::Digest).signing_algorithm(SigningAlgorithmSpec::EcdsaSha256);
    match pedido.send().await {
        Ok(_) => println!("Firma con {nombre}: aceptada"),
        Err(error) => {
            // code() y message() son los dos campos que envió el servicio en su respuesta de error.
            println!("Firma con {nombre}: rechazada\n  error: {}", error.code().unwrap_or("?"));
            println!("≈ mensaje: {}", error.message().unwrap_or("(el servicio no envió texto)"));
        }
    }
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let configuracion = aws_sdk_kms::Config::builder().behavior_version(BehaviorVersion::latest()).region(Region::new("us-east-1")).credentials_provider(credenciales).endpoint_url("http://localhost:4566");
    let kms = Client::from_conf(configuracion.build());
    let cadena = ProviderBuilder::new().connect_http(RPC.parse()?);

    if reqwest::get("http://localhost:4566/_floci/health").await.is_err() {
        salir("No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
    }
    if cadena.get_chain_id().await.is_err() {
        salir("No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
    }
    // El alias dice qué llave está en uso. Los cambios de estado se piden con el id de la llave.
    let Ok(descrita) = kms.describe_key().key_id(ALIAS).send().await else {
        salir("Falta la llave del paso 1. Corre antes: cargo run -q --bin ciclo_de_vida_llave_p1");
    };
    let llave = descrita.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?.key_id().to_string();
    let direccion = direccion_de(&kms, &llave).await?;

    println!("Estado: {}", estado_de(&kms, &llave).await?);
    probar_firma(&kms, ALIAS, "el alias").await;

    kms.disable_key().key_id(&llave).send().await?;
    println!("\nDisableKey → estado: {}", estado_de(&kms, &llave).await?);
    probar_firma(&kms, ALIAS, "el alias").await;
    println!("Saldo de la dirección: {} ETH. La cadena no se entera: los fondos siguen ahí.", en_eth(cadena.get_balance(direccion).await?));

    kms.enable_key().key_id(&llave).send().await?;
    println!("\nEnableKey → estado: {}", estado_de(&kms, &llave).await?);
    probar_firma(&kms, ALIAS, "el alias").await;
    println!("\n✔ Deshabilitar detiene la firma al instante y no destruye nada: con EnableKey la misma llave vuelve a firmar.");
    Ok(())
}
