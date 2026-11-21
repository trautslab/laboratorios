// Paso 5 · Cancelar a tiempo, rescatar lo que llegó y retirar la llave en orden.
use alloy::consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::Encodable2718;
use alloy::primitives::{keccak256, utils::format_ether, Address, Signature, TxKind, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionReceipt;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::{Blob, DateTimeFormat};
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::Client;

const ALIAS: &str = "alias/ruta-ciclo-de-vida-llave";
const ALIAS_ANTERIOR: &str = "alias/ruta-ciclo-de-vida-llave-anterior";
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

// Id y estado de una llave, pedidos por su id o por un alias.
async fn describir(kms: &Client, llave: &str) -> eyre::Result<(String, String)> {
    let respuesta = kms.describe_key().key_id(llave).send().await?;
    let metadatos = respuesta.key_metadata().ok_or_else(|| eyre::eyre!("sin metadatos"))?;
    Ok((metadatos.key_id().to_string(), metadatos.key_state().map(|e| e.as_str().to_string()).unwrap_or_default()))
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
    let Ok((anterior, estado)) = describir(&kms, ALIAS_ANTERIOR).await else {
        salir("Falta la llave anterior. Corre antes los pasos 3 y 4.");
    };
    if estado != "PendingDeletion" {
        salir(&format!("La llave anterior está en {estado}, no pendiente de borrado. Corre antes: cargo run -q --bin ciclo_de_vida_llave_p4"));
    }

    // Mientras dure la espera, la destrucción se puede cancelar.
    kms.cancel_key_deletion().key_id(&anterior).send().await?;
    let (_, estado) = describir(&kms, &anterior).await?;
    println!("CancelKeyDeletion → estado: {estado}");
    // La documentación de AWS KMS dice que la llave vuelve deshabilitada: en ese caso hay que habilitarla.
    if estado == "Disabled" {
        kms.enable_key().key_id(&anterior).send().await?;
    }

    // 1. Detener: el programa que paga ya no usa esta llave, porque el alias apunta a otra.
    let (nueva, _) = describir(&kms, ALIAS).await?;
    let (dir_anterior, dir_nueva) = (direccion_de(&kms, &anterior).await?, direccion_de(&kms, &nueva).await?);
    println!("\nRetiro en orden:");
    println!("  1. detener    el alias de pagos apunta a otra llave: {}", if nueva != anterior { "sí" } else { "no" });

    // 2. Mover: lo que quede en la dirección sale con una firma de la llave que se retira.
    let monto = cadena.get_balance(dir_anterior).await? - U256::from(COMISION);
    let traslado = enviar_con_kms(&kms, &cadena, &anterior, dir_nueva, monto).await?;
    println!("  2. mover      {} ETH a la dirección nueva · recibo: status {}", en_eth(monto), traslado.status() as u8);

    // 3. Verificar: sin saldo cero no se programa nada.
    let resto = cadena.get_balance(dir_anterior).await?;
    println!("  3. verificar  saldo de la dirección anterior: {} ETH", en_eth(resto));
    if !resto.is_zero() {
        salir("La dirección anterior todavía tiene saldo. No se programa la destrucción.");
    }

    // 4. Programar: primero deshabilitar, después programar la destrucción con su espera.
    kms.disable_key().key_id(&anterior).send().await?;
    let (_, deshabilitada) = describir(&kms, &anterior).await?;
    let programada = kms.schedule_key_deletion().key_id(&anterior).pending_window_in_days(7).send().await?;
    let fecha = programada.deletion_date().ok_or_else(|| eyre::eyre!("sin fecha"))?;
    println!("  4. programar  DisableKey → {deshabilitada} · ScheduleKeyDeletion con 7 días → {}", describir(&kms, &anterior).await?.1);
    println!("  5. esperar    hasta la fecha de borrado se vigila la dirección; si llega algo, se cancela y se repite");

    // Lo que el custodio guarda fuera del KMS: cuando la llave se borre, el servicio ya no responderá por ella.
    println!("\nRegistro del retiro:");
    println!("≈ llave retirada: {anterior}");
    println!("≈ dirección retirada: {dir_anterior}");
    println!("≈ llave que la reemplaza: {nueva}");
    println!("≈ dirección que la reemplaza: {dir_nueva}");
    println!("≈ transacción del último traslado: {}", traslado.transaction_hash);
    println!("≈ fecha de borrado: {}", fecha.fmt(DateTimeFormat::DateTime)?);
    println!("Saldos al cerrar · anterior {} ETH · nueva {} ETH", en_eth(cadena.get_balance(dir_anterior).await?), en_eth(cadena.get_balance(dir_nueva).await?));
    println!("\n✔ Retiro en orden: detener, mover, verificar saldo cero, programar y esperar. Lo que se destruye es una llave de una dirección vacía.");
    Ok(())
}
