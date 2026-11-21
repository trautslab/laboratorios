// Paso 4 · Programar la destrucción: una espera obligatoria y, mientras dura, la llave no firma.
use alloy::network::TransactionBuilder;
use alloy::primitives::{keccak256, utils::format_ether, utils::parse_ether, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::error::ProvideErrorMetadata;
use aws_sdk_kms::primitives::{Blob, DateTimeFormat};
use aws_sdk_kms::types::{KeySpec, KeyState, KeyUsageType, MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::Client;
use std::time::{SystemTime, UNIX_EPOCH};

const ALIAS_ANTERIOR: &str = "alias/ruta-ciclo-de-vida-llave-anterior";
const DIAS: i32 = 7; // el mínimo que admite la documentación de AWS KMS (de 7 a 30)
const RPC: &str = "http://127.0.0.1:8545";
// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Solo reparte ETH ficticio.
const DE_PRUEBA: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Credenciales FICTICIAS escritas aquí a propósito: el cliente no lee las de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let configuracion = aws_sdk_kms::Config::builder().behavior_version(BehaviorVersion::latest()).region(Region::new("us-east-1")).credentials_provider(credenciales).endpoint_url("http://localhost:4566");
    let kms = Client::from_conf(configuracion.build());
    let de_prueba: PrivateKeySigner = DE_PRUEBA.parse()?;
    let cadena = ProviderBuilder::new().wallet(de_prueba).connect_http(RPC.parse()?);

    if reqwest::get("http://localhost:4566/_floci/health").await.is_err() {
        salir("No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
    }
    if cadena.get_chain_id().await.is_err() {
        salir("No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
    }
    let Ok(descrita) = kms.describe_key().key_id(ALIAS_ANTERIOR).send().await else {
        salir("Falta la llave anterior. Corre antes: cargo run -q --bin ciclo_de_vida_llave_p3");
    };
    let metadatos = descrita.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?;
    let anterior = metadatos.key_id().to_string();
    if metadatos.key_state() != Some(&KeyState::Enabled) {
        salir(&format!("La llave anterior está en {}. Corre el paso 5 o empieza de nuevo desde el paso 1.", metadatos.key_state().map(|e| e.as_str()).unwrap_or("?")));
    }
    // La dirección se calcula ahora: con la llave pendiente de borrado, el servicio ya no entrega su llave pública.
    let direccion = direccion_de(&kms, &anterior).await?;
    println!("≈ dirección anterior: {direccion}");

    // Sondeo: ¿acepta este servicio una espera menor que el mínimo documentado? Se prueba con una llave de descarte.
    let creada = kms.create_key().key_spec(KeySpec::EccSecgP256K1).key_usage(KeyUsageType::SignVerify).description("ruta: llave de descarte").send().await?;
    let descarte = creada.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?.key_id().to_string();
    let sondeo = match kms.schedule_key_deletion().key_id(&descarte).pending_window_in_days(1).send().await {
        Ok(_) => "aceptado".to_string(),
        Err(error) => format!("rechazado ({})", error.code().unwrap_or("?")),
    };
    println!("Sondeo con una llave de descarte: ScheduleKeyDeletion con 1 día → {sondeo}");

    // La destrucción no es inmediata: se programa, y el servicio responde con la fecha.
    let programada = kms.schedule_key_deletion().key_id(&anterior).pending_window_in_days(DIAS).send().await?;
    let fecha = programada.deletion_date().ok_or_else(|| eyre::eyre!("sin fecha"))?;
    let ahora = kms.describe_key().key_id(&anterior).send().await?;
    let estado = ahora.key_metadata().and_then(|m| m.key_state()).map(|e| e.as_str()).unwrap_or("?");
    println!("\nScheduleKeyDeletion con {DIAS} días sobre la llave anterior → estado: {estado}");
    println!("≈ fecha de borrado: {}", fecha.fmt(DateTimeFormat::DateTime)?);
    let hoy = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs() as i64;
    println!("Días hasta esa fecha: {}", (fecha.secs() - hoy + 43_200) / 86_400);

    // En este estado la llave no firma, y EnableKey tampoco la recupera.
    let pedido = kms.sign().key_id(&anterior).message(Blob::new([1u8; 32])).message_type(MessageType::Digest).signing_algorithm(SigningAlgorithmSpec::EcdsaSha256);
    match pedido.send().await {
        Ok(_) => println!("Firma con la llave anterior: aceptada"),
        Err(error) => {
            println!("Firma con la llave anterior: rechazada\n  error: {}", error.code().unwrap_or("?"));
            println!("≈ mensaje: {}", error.message().unwrap_or("(el servicio no envió texto)"));
        }
    }
    let habilitar = match kms.enable_key().key_id(&anterior).send().await {
        Ok(_) => "aceptado".to_string(),
        Err(error) => format!("rechazado ({})", error.code().unwrap_or("?")),
    };
    println!("EnableKey sobre la llave anterior: {habilitar}");

    // La cadena no sabe nada del estado de la llave: la dirección sigue recibiendo.
    let deposito = cadena.send_transaction(TransactionRequest::default().with_to(direccion).with_value(parse_ether("0.05")?)).await?.get_receipt().await?;
    println!("\nUn depósito de 0.05 ETH llega a la dirección anterior · recibo: status {}", deposito.status() as u8);
    println!("Saldo de la dirección anterior: {} ETH. La única llave que puede moverlo no firma.", en_eth(cadena.get_balance(direccion).await?));
    println!("\n✔ Programar la destrucción deja la llave sin firmar durante la espera. Si la fecha llega con saldo en la dirección, ese saldo se pierde.");
    Ok(())
}
