// Paso 1 · Preparar la llave en KMS, calcular su dirección y darle ETH de prueba.
use alloy::network::TransactionBuilder;
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::Address;
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::types::{KeySpec, KeyUsageType};

const KMS: &str = "http://localhost:4566";
const NODO: &str = "http://127.0.0.1:8545";
const ALIAS: &str = "alias/ruta-kms-firmar-transaccion";

fn salir(mensaje: String) -> ! {
    eprintln!("{mensaje}");
    std::process::exit(1)
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let config = aws_sdk_kms::Config::builder().behavior_version(BehaviorVersion::latest()).endpoint_url(KMS).region(Region::new("us-east-1")).credentials_provider(credenciales).build();
    let kms = aws_sdk_kms::Client::from_conf(config);

    // La llave se busca por su alias. Solo si no existe se crea: correr esto dos veces no crea dos llaves.
    let (llave, origen) = match kms.describe_key().key_id(ALIAS).send().await {
        Ok(respuesta) => (respuesta.key_metadata.unwrap(), "ya existía"),
        Err(error) if error.as_service_error().is_some_and(|e| e.is_not_found_exception()) => {
            let creada = kms.create_key().key_spec(KeySpec::EccSecgP256K1).key_usage(KeyUsageType::SignVerify).send().await?.key_metadata.unwrap();
            kms.create_alias().alias_name(ALIAS).target_key_id(creada.key_id()).send().await?;
            (creada, "creada ahora")
        }
        Err(_) => salir(format!("✖ No hay KMS en {KMS}. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0")),
    };

    // La dirección sale de la llave pública: los últimos 20 bytes de keccak256 de sus coordenadas X e Y.
    let publica = kms.get_public_key().key_id(ALIAS).send().await?.public_key.unwrap().into_inner();
    let direccion = Address::from_raw_public_key(&publica[publica.len() - 64..]);
    println!("Alias:   {ALIAS}");
    println!("≈ Llave: {} ({origen})", llave.key_id());
    println!("Tipo:    {}, uso {}", llave.key_spec().unwrap().as_str(), llave.key_usage().unwrap().as_str());
    println!("≈ Dirección: {direccion}");

    // La cuenta de prueba 0 de Anvil (su llave es pública) le envía 1 ETH, solo si todavía no tiene.
    let cuenta0: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let red = ProviderBuilder::new().wallet(cuenta0).connect_http(NODO.parse()?);
    let Ok(saldo) = red.get_balance(direccion).await else {
        salir(format!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil"));
    };
    if saldo.is_zero() {
        red.send_transaction(TransactionRequest::default().with_to(direccion).with_value(parse_ether("1")?)).await?.get_receipt().await?;
    }
    let saldo = format_ether(red.get_balance(direccion).await?);
    println!("\nSaldo de esa dirección: {} ETH", saldo.trim_end_matches('0').trim_end_matches('.'));
    println!("Nonce de esa dirección: {}", red.get_transaction_count(direccion).await?);
    println!("\n✔ La llave está en KMS, su dirección tiene ETH de prueba y todavía no envió nada.");
    Ok(())
}
