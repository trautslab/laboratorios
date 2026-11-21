// Paso 6 · La dirección que sale del KMS es una cuenta como cualquier otra: recibe y tiene saldo.
use alloy::primitives::{address, utils::{format_ether, parse_ether}, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::{Client, Config};

const ALIAS: &str = "alias/ruta-kms-llave-y-direccion";
const CUENTA_DE_PRUEBA: Address = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // la cuenta 0 de Anvil

fn en_eth(saldo: alloy::primitives::U256) -> String {
    let eth = format_ether(saldo);
    eth.trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Emulador local y credenciales ficticias escritas aquí: el cliente no lee las de tu máquina.
    let config = Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .endpoint_url("http://localhost:4566")
        .region(Region::new("us-east-1"))
        .credentials_provider(Credentials::new("test", "test", None, None, "lab"))
        .build();
    let kms = Client::from_conf(config);

    let Ok(respuesta) = kms.get_public_key().key_id(ALIAS).send().await else {
        eprintln!("✖ El KMS no respondió por {ALIAS}. Revisa que el emulador esté corriendo y corre antes el paso 1.");
        std::process::exit(1);
    };
    let der = respuesta.public_key().expect("GetPublicKey devuelve la llave pública").as_ref();
    let direccion = Address::from_raw_public_key(&der[der.len() - 64..]);

    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);
    let Ok(antes) = cadena.get_balance(direccion).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("≈ Dirección del custodio: {direccion}");
    println!("Saldo antes: {} ETH", en_eth(antes));

    // Para recibir no se le pide nada al KMS: quien envía solo necesita conocer la dirección.
    // Envía la cuenta de prueba 0, y Anvil firma por ella.
    let envio = TransactionRequest::default().from(CUENTA_DE_PRUEBA).to(direccion).value(parse_ether("1")?);
    let recibo = cadena.send_transaction(envio).await?.get_receipt().await?;
    println!("La cuenta de prueba 0 de Anvil le envía 1 ETH");
    println!("≈ Transacción: {}", recibo.transaction_hash);

    println!("Saldo después: {} ETH", en_eth(cadena.get_balance(direccion).await?));
    println!("Transacciones enviadas desde esa dirección: {}", cadena.get_transaction_count(direccion).await?);
    println!("\n✔ La cadena lleva un saldo para esa dirección. Para moverlo hará falta una firma del KMS.");
    Ok(())
}
