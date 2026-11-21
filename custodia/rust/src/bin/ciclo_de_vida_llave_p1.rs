// Paso 1 · Una llave nueva en el KMS, con dirección, fondos y una primera firma.
use alloy::consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::Encodable2718;
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, keccak256, utils::format_ether, utils::parse_ether, Address, Signature, TxKind, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::{TransactionReceipt, TransactionRequest};
use alloy::signers::local::PrivateKeySigner;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::error::ProvideErrorMetadata;
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{KeySpec, KeyUsageType, MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::Client;

const ALIAS: &str = "alias/ruta-ciclo-de-vida-llave";
const CLIENTE: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // cuenta de prueba 1 de Anvil
const PRECIO: u128 = 2_000_000_000; // precio fijo del gas: la comisión de una transferencia es 21000 × 2 gwei
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

// Dirección de una llave del KMS: keccak256 de su llave pública, últimos 20 bytes.
// Se explica en «Crear una llave en KMS y obtener su dirección».
async fn direccion_de(kms: &Client, llave: &str) -> eyre::Result<Address> {
    let respuesta = kms.get_public_key().key_id(llave).send().await?;
    let der = respuesta.public_key().ok_or_else(|| eyre::eyre!("sin llave pública"))?.as_ref();
    Ok(Address::from_slice(&keccak256(&der[der.len() - 64..])[12..]))
}

// Transferencia firmada por una llave del KMS. Cómo la firma del KMS se convierte en la firma
// de una transacción se explica en «Firmar una transacción con KMS y enviarla».
async fn enviar_con_kms(kms: &Client, cadena: &impl Provider, llave: &str, para: Address, valor: U256) -> eyre::Result<TransactionReceipt> {
    let desde = direccion_de(kms, llave).await?;
    let nonce = cadena.get_transaction_count(desde).await?;
    let tx = TxEip1559 { chain_id: 31337, nonce, gas_limit: 21000, max_fee_per_gas: PRECIO, max_priority_fee_per_gas: PRECIO, to: TxKind::Call(para), value: valor, ..Default::default() };
    let hash = tx.signature_hash();
    let pedido = kms.sign().key_id(llave).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest).signing_algorithm(SigningAlgorithmSpec::EcdsaSha256);
    let respuesta = pedido.send().await?;
    let der = k256::ecdsa::Signature::from_der(respuesta.signature().ok_or_else(|| eyre::eyre!("sin firma"))?.as_ref())?;
    let der = der.normalize_s().unwrap_or(der);
    let (r, s) = (U256::from_be_slice(&der.r().to_bytes()), U256::from_be_slice(&der.s().to_bytes()));
    for paridad in [false, true] {
        let firma = Signature::new(r, s, paridad);
        if firma.recover_address_from_prehash(&hash).ok() != Some(desde) {
            continue;
        }
        let cruda = TxEnvelope::from(tx.into_signed(firma)).encoded_2718();
        return Ok(cadena.send_raw_transaction(&cruda).await?.get_receipt().await?);
    }
    eyre::bail!("La firma no corresponde a la dirección de la llave")
}

// El alias es el nombre fijo que usa el programa que firma. Si ya existe de una corrida anterior
// se reapunta a la llave nueva; si no existe, se crea.
async fn apuntar_alias(kms: &Client, alias: &str, id: &str) -> eyre::Result<()> {
    if let Err(error) = kms.update_alias().alias_name(alias).target_key_id(id).send().await {
        if error.code() != Some("NotFoundException") {
            return Err(error.into());
        }
        kms.create_alias().alias_name(alias).target_key_id(id).send().await?;
    }
    Ok(())
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

    // Una llave de firma en la curva de Ethereum. Nace en el estado Enabled.
    let creada = kms.create_key().key_spec(KeySpec::EccSecgP256K1).key_usage(KeyUsageType::SignVerify).description("ruta: ciclo de vida de una llave").send().await?;
    let llave = creada.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?;
    let direccion = direccion_de(&kms, llave.key_id()).await?;
    apuntar_alias(&kms, ALIAS, llave.key_id()).await?;
    println!("Llave creada · estado: {}", llave.key_state().map(|e| e.as_str()).unwrap_or("?"));
    println!("≈ id de la llave: {}", llave.key_id());
    println!("≈ dirección: {direccion}");
    println!("{ALIAS} → esa llave");

    let fondeo = cadena.send_transaction(TransactionRequest::default().with_to(direccion).with_value(parse_ether("1")?)).await?.get_receipt().await?;
    println!("Fondeo: 1 ETH de prueba a la dirección · recibo: status {}", fondeo.status() as u8);

    // El programa que paga no conoce el id de la llave: firma a través del alias.
    let pago = enviar_con_kms(&kms, &cadena, ALIAS, CLIENTE, parse_ether("0.1")?).await?;
    println!("Pago de 0.1 ETH firmado con el alias · recibo: status {}", pago.status() as u8);
    println!("Saldo de la dirección: {} ETH (1 − 0.1 − 0.000042 de comisión)", en_eth(cadena.get_balance(direccion).await?));
    println!("\n✔ La llave firma: su dirección recibió fondos y pagó con una firma hecha dentro del KMS.");
    Ok(())
}
