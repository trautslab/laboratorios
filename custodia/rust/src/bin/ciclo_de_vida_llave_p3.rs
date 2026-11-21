// Paso 3 · Reemplazar: una llave de firma no se rota. Llave nueva, dirección nueva, y mover los fondos.
use alloy::consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::Encodable2718;
use alloy::primitives::{address, keccak256, utils::format_ether, utils::parse_ether, Address, Signature, TxKind, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionReceipt;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::error::ProvideErrorMetadata;
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{KeySpec, KeyUsageType, MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::Client;

const ALIAS: &str = "alias/ruta-ciclo-de-vida-llave";
const ALIAS_ANTERIOR: &str = "alias/ruta-ciclo-de-vida-llave-anterior";
const CLIENTE: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // cuenta de prueba 1 de Anvil
const PRECIO: u128 = 2_000_000_000; // precio fijo del gas
const COMISION: u128 = 21000 * PRECIO; // lo que cuesta una transferencia: 0.000042 ETH
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

// Si el alias ya existe se reapunta; si no existe, se crea.
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
    let cadena = ProviderBuilder::new().connect_http(RPC.parse()?);

    if reqwest::get("http://localhost:4566/_floci/health").await.is_err() {
        salir("No hay llavero en http://localhost:4566. Corre: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
    }
    if cadena.get_chain_id().await.is_err() {
        salir("No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
    }
    let Ok(descrita) = kms.describe_key().key_id(ALIAS).send().await else {
        salir("Falta la llave del paso 1. Corre antes: cargo run -q --bin ciclo_de_vida_llave_p1");
    };
    let anterior = descrita.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?.key_id().to_string();

    // Primer intento: pedir al servicio que rote la llave, como se hace con una llave de cifrado.
    match kms.enable_key_rotation().key_id(&anterior).send().await {
        Ok(_) => println!("EnableKeyRotation sobre la llave en uso: aceptado"),
        Err(error) => {
            // code() y message() son los dos campos que envió el servicio en su respuesta de error.
            println!("EnableKeyRotation sobre la llave en uso: rechazado\n  error: {}", error.code().unwrap_or("?"));
            println!("≈ mensaje: {}", error.message().unwrap_or("(el servicio no envió texto)"));
        }
    }

    // Lo que sí existe: otra llave. Y otra llave es otra dirección.
    let creada = kms.create_key().key_spec(KeySpec::EccSecgP256K1).key_usage(KeyUsageType::SignVerify).description("ruta: ciclo de vida de una llave (reemplazo)").send().await?;
    let nueva = creada.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?;
    let (dir_anterior, dir_nueva) = (direccion_de(&kms, &anterior).await?, direccion_de(&kms, nueva.key_id()).await?);
    println!("\nLlave nueva creada · estado: {}", nueva.key_state().map(|e| e.as_str()).unwrap_or("?"));
    println!("≈ id de la llave nueva: {}", nueva.key_id());
    println!("≈ dirección anterior: {dir_anterior}");
    println!("≈ dirección nueva: {dir_nueva}");
    println!("Otra llave, otra dirección: {}", if dir_anterior != dir_nueva { "sí" } else { "no" });

    // La única «rotación» de una llave de cuenta: una transacción, firmada por la llave anterior,
    // que lleva todo el saldo a la dirección nueva. Se envía el saldo menos la comisión.
    println!("\nAntes   · anterior {} ETH · nueva {} ETH", en_eth(cadena.get_balance(dir_anterior).await?), en_eth(cadena.get_balance(dir_nueva).await?));
    let monto = cadena.get_balance(dir_anterior).await? - U256::from(COMISION);
    let traslado = enviar_con_kms(&kms, &cadena, &anterior, dir_nueva, monto).await?;
    println!("Traslado de {} ETH firmado por la llave anterior · comisión {} ETH · recibo: status {}", en_eth(monto), en_eth(U256::from(COMISION)), traslado.status() as u8);
    println!("Después · anterior {} ETH · nueva {} ETH", en_eth(cadena.get_balance(dir_anterior).await?), en_eth(cadena.get_balance(dir_nueva).await?));

    // El programa que paga firma a través del alias: al reapuntarlo, sigue a la llave nueva sin cambios.
    apuntar_alias(&kms, ALIAS, nueva.key_id()).await?;
    apuntar_alias(&kms, ALIAS_ANTERIOR, &anterior).await?;
    println!("\nUpdateAlias: {ALIAS} → llave nueva");
    println!("{ALIAS_ANTERIOR} → llave anterior");
    let pago = enviar_con_kms(&kms, &cadena, ALIAS, CLIENTE, parse_ether("0.1")?).await?;
    println!("Pago de 0.1 ETH firmado con el alias · recibo: status {} · salió de la dirección nueva: {}", pago.status() as u8, if pago.from == dir_nueva { "sí" } else { "no" });
    println!("Saldos  · anterior {} ETH · nueva {} ETH", en_eth(cadena.get_balance(dir_anterior).await?), en_eth(cadena.get_balance(dir_nueva).await?));
    println!("\n✔ Reemplazar una llave de firma es cambiar de dirección: llave nueva, fondos trasladados y el alias apuntando a ella.");
    Ok(())
}
