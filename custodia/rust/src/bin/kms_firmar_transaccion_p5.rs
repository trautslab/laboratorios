// Paso 5 · El recorrido completo: armar, pedir la firma a KMS, corregirla, adjuntarla y enviar.
use alloy::consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::Encodable2718;
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::{address, keccak256, Address, Signature, TxKind, B256, U256};
use alloy::providers::{Provider, ProviderBuilder};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};

const KMS: &str = "http://localhost:4566";
const NODO: &str = "http://127.0.0.1:8545";
const ALIAS: &str = "alias/ruta-kms-firmar-transaccion";
const DESTINO: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");

fn salir(mensaje: &str) -> ! {
    eprintln!("{mensaje}");
    std::process::exit(1)
}
fn eth(wei: U256) -> String {
    format_ether(wei).trim_end_matches('0').trim_end_matches('.').to_string()
}

// 2 · La dirección de la llave y la firma de KMS sobre ese hash (pasos 1 y 3).
async fn pedir_a_kms(hash: B256) -> eyre::Result<(Address, U256, U256)> {
    // Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let config = aws_sdk_kms::Config::builder().behavior_version(BehaviorVersion::latest()).endpoint_url(KMS).region(Region::new("us-east-1")).credentials_provider(credenciales).build();
    let kms = aws_sdk_kms::Client::from_conf(config);
    let publica = kms.get_public_key().key_id(ALIAS).send().await?.public_key.unwrap().into_inner();
    let direccion = Address::from_raw_public_key(&publica[publica.len() - 64..]);
    let respuesta = kms.sign().key_id(ALIAS).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest).signing_algorithm(SigningAlgorithmSpec::EcdsaSha256).send().await?;
    let firma = k256::ecdsa::Signature::from_der(respuesta.signature().unwrap().as_ref())?;
    Ok((direccion, U256::from_be_slice(&firma.r().to_bytes()), U256::from_be_slice(&firma.s().to_bytes())))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let n = U256::from_str_radix("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)?;

    // 1 · La transacción sin firmar y su hash (paso 2).
    let transaccion = TxEip1559 { chain_id: 31337, nonce: 0, max_priority_fee_per_gas: 1_000_000_000, max_fee_per_gas: 2_000_000_000, gas_limit: 21000, to: TxKind::Call(DESTINO), value: parse_ether("0.25")?, ..Default::default() };
    let hash = transaccion.signature_hash();
    let Ok((direccion, r, mut s)) = pedir_a_kms(hash).await else {
        salir("✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.");
    };

    // 3 · Las dos correcciones (paso 4): s a la mitad baja y el yParity que recupera la dirección.
    if s > n / U256::from(2) {
        s = n - s;
    }
    let mut firma = None;
    for y_parity in [false, true] {
        let candidata = Signature::new(r, s, y_parity);
        if candidata.recover_address_from_prehash(&hash)? == direccion {
            firma = Some(candidata);
        }
    }
    let Some(firma) = firma else {
        salir("✖ La firma no corresponde a la llave: no se envía nada.");
    };

    // 4 · La firma se adjunta a los mismos campos: tres valores más al final de la lista.
    let firmada = TxEnvelope::from(transaccion.into_signed(firma)).encoded_2718();
    println!("Hash que firmó KMS: {hash}");
    println!("≈ Transacción firmada: 0x{}", hex::encode(&firmada));
    println!("≈ Hash de la transacción: {}", keccak256(&firmada));

    let red = ProviderBuilder::new().connect_http(NODO.parse()?);
    let Ok(antes) = red.get_balance(direccion).await else {
        salir(&format!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil"));
    };
    // 5 · Enviar los bytes y esperar el recibo. Para esto no hace falta KMS: la firma ya va dentro.
    let Ok(pendiente) = red.send_raw_transaction(&firmada).await else {
        salir("✖ La cadena no aceptó la transacción. Si ya corriste este paso, reinicia Anvil y repite el paso 1.");
    };
    let recibo = pendiente.get_receipt().await?;
    println!("\nRecibo:");
    println!("  estado:    {}", if recibo.status() { "success" } else { "reverted" });
    println!("  bloque:    {}", recibo.block_number.unwrap_or_default());
    println!("  gas usado: {}", recibo.gas_used);
    println!("≈ Remitente según la cadena: {}", recibo.from);
    println!("El remitente es la dirección de la llave de KMS: {}", if recibo.from == direccion { "sí" } else { "no" });
    println!("\nSaldos:");
    println!("  dirección de KMS: {} ETH → {} ETH", eth(antes), eth(red.get_balance(direccion).await?));
    println!("  destinatario:     {} ETH", eth(red.get_balance(DESTINO).await?));
    println!("  nonce de la dirección de KMS: {}", red.get_transaction_count(direccion).await?);
    println!("\n✔ La cadena aceptó una transacción firmada por una llave que tu programa nunca tuvo.");
    Ok(())
}
