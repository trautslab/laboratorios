// Paso 3 · Enviar a KMS solo el hash y leer la firma DER que devuelve.
use alloy::consensus::{SignableTransaction, TxEip1559};
use alloy::primitives::utils::parse_ether;
use alloy::primitives::{address, TxKind};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};

const KMS: &str = "http://localhost:4566";
const ALIAS: &str = "alias/ruta-kms-firmar-transaccion";

// DER: 30 <largo> 02 <largo de r> <r> 02 <largo de s> <s>. Devuelve dónde empieza y cuánto mide cada entero.
fn leer_der(der: &[u8]) -> eyre::Result<((usize, usize), (usize, usize))> {
    eyre::ensure!(der[0] == 0x30 && der[1] as usize == der.len() - 2 && der[2] == 0x02, "No es una firma DER");
    let r = (4, der[3] as usize);
    eyre::ensure!(der[r.0 + r.1] == 0x02, "No es una firma DER");
    let s = (r.0 + r.1 + 2, der[r.0 + r.1 + 1] as usize);
    Ok((r, s))
}
// Un entero DER que empieza con un byte de 80 o más lleva un 00 delante. Como número es el mismo.
fn numero(bytes: &[u8]) -> String {
    format!("0x{:0>64}", hex::encode(bytes).trim_start_matches("00"))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let config = aws_sdk_kms::Config::builder().behavior_version(BehaviorVersion::latest()).endpoint_url(KMS).region(Region::new("us-east-1")).credentials_provider(credenciales).build();
    let kms = aws_sdk_kms::Client::from_conf(config);

    // La transacción del paso 2 y su hash.
    let destino = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");
    let transaccion = TxEip1559 { chain_id: 31337, nonce: 0, max_priority_fee_per_gas: 1_000_000_000, max_fee_per_gas: 2_000_000_000, gas_limit: 21000, to: TxKind::Call(destino), value: parse_ether("0.25")?, ..Default::default() };
    let hash = transaccion.signature_hash();

    // MessageType DIGEST: el mensaje ya es un hash y KMS lo firma tal cual, sin volver a calcularlo.
    let pedido = kms.sign().key_id(ALIAS).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest).signing_algorithm(SigningAlgorithmSpec::EcdsaSha256);
    let respuesta = match pedido.send().await {
        Ok(respuesta) => respuesta,
        Err(_) => {
            eprintln!("✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.");
            std::process::exit(1);
        }
    };
    let der = respuesta.signature().unwrap().as_ref();
    let (r, s) = leer_der(der)?;
    let relleno = |desde: usize| if der[desde] == 0 { ", el primero es un 00 de relleno" } else { "" };

    println!("Lo que viaja a KMS:");
    println!("  KeyId:            {ALIAS}");
    println!("  Message:          {hash} ({} bytes)", hash.len());
    println!("  MessageType:      {}", MessageType::Digest.as_str());
    println!("  SigningAlgorithm: {}", SigningAlgorithmSpec::EcdsaSha256.as_str());
    println!("\nLo que devuelve KMS:");
    println!("≈ Llave que firmó: {}", respuesta.key_id().unwrap_or_default());
    println!("≈ Firma DER: 0x{}", hex::encode(der));
    println!("≈ Largo de la firma: {} bytes", der.len());
    println!("\nLa firma por dentro: 30 largo, 02 largo r, 02 largo s");
    println!("≈ Entero r: {} bytes{}", r.1, relleno(r.0));
    println!("≈ Entero s: {} bytes{}", s.1, relleno(s.0));
    println!("≈ r: {}", numero(&der[r.0..r.0 + r.1]));
    println!("≈ s: {}", numero(&der[s.0..s.0 + s.1]));
    println!("\n✔ KMS firmó 32 bytes sin ver la transacción y devolvió dos números, r y s. Todavía no es una firma que la cadena acepte.");
    Ok(())
}
