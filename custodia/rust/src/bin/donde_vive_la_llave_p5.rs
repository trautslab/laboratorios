// Paso 5 · Firmar con el KMS: viaja el hash, vuelve la firma. La llave no se mueve.
use alloy::primitives::{keccak256, B256};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::operation::sign::SignOutput;
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::{Client, Config};
use k256::ecdsa::signature::hazmat::PrehashVerifier;
use k256::ecdsa::{Signature, VerifyingKey};
use k256::pkcs8::DecodePublicKey;

const KMS: &str = "http://localhost:4566"; // Floci, el emulador local
const ALIAS: &str = "alias/ruta-donde-vive-la-llave";

// DIGEST: lo que se envía ya es un hash, el servicio no lo vuelve a pasar por SHA-256.
async fn firmar(kms: &Client, hash: &B256) -> eyre::Result<SignOutput> {
    let peticion = kms.sign().key_id(ALIAS).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest);
    Ok(peticion.signing_algorithm(SigningAlgorithmSpec::EcdsaSha256).send().await?)
}

async fn paso(kms: &Client) -> eyre::Result<()> {
    let hash = keccak256("Orden de retiro 42: 1 ETH para Ana"); // los mismos 32 bytes del paso 1
    let otro_hash = keccak256("Orden de retiro 43: 100 ETH para Ana");
    let primera = firmar(kms, &hash).await?;
    let segunda = firmar(kms, &hash).await?;
    let der = |firma: &SignOutput| firma.signature.as_ref().map(|blob| blob.as_ref().to_vec()).unwrap_or_default();
    println!("Firmar con el KMS: viaja el hash, la llave no");
    println!("  Hash enviado: {hash}");
    println!("  Petición: Sign · KeyId {ALIAS} · MessageType DIGEST");
    println!("  Algoritmo que devuelve el servicio: {}", primera.signing_algorithm.as_ref().map(|v| v.as_str()).unwrap_or("?"));
    println!("≈ Firma 1 (DER): 0x{}", hex::encode(der(&primera)));
    println!("≈ Firma 2 (DER): 0x{}", hex::encode(der(&segunda)));
    println!("  ¿Las dos firmas del mismo hash son iguales? {}", if der(&primera) == der(&segunda) { "sí" } else { "no" });

    // Verificar fuera del KMS: alcanza con la llave pública, que llega en formato DER.
    let publica = kms.get_public_key().key_id(ALIAS).send().await?.public_key.ok_or_else(|| eyre::eyre!("sin llave pública"))?;
    let verificadora = VerifyingKey::from_public_key_der(publica.as_ref())?;
    let vale = |firma: &SignOutput, hash: &B256| {
        // normalize_s: el KMS puede devolver la S alta, que para ECDSA es igual de válida; k256 solo acepta la baja.
        let leida = Signature::from_der(&der(firma)).map(|firma| firma.normalize_s().unwrap_or(firma));
        if leida.is_ok_and(|firma| verificadora.verify_prehash(hash.as_slice(), &firma).is_ok()) { "válida" } else { "no válida" }
    };
    println!("\nVerificar con la llave pública, sin el KMS");
    println!("  Firma 1 sobre el hash: {}", vale(&primera, &hash));
    println!("  Firma 2 sobre el hash: {}", vale(&segunda, &hash));
    println!("  Firma 1 sobre otro hash: {}", vale(&primera, &otro_hash));
    println!("  Bytes de llave privada que pasaron por este programa: 0");
    println!("✔ El KMS firmó dos veces y las dos firmas verifican con la llave pública. La privada no salió del servicio.");
    Ok(())
}

#[tokio::main]
async fn main() {
    // Credenciales FICTICIAS escritas aquí a propósito: el cliente nunca mira las de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let configuracion = Config::builder().behavior_version(BehaviorVersion::latest()).region(Region::new("us-east-1")).credentials_provider(credenciales).endpoint_url(KMS);
    if let Err(error) = paso(&Client::from_conf(configuracion.build())).await {
        eprintln!("✖ No se pudo firmar ({error}). Corre antes el paso 4 y comprueba que el emulador está arrancado.");
        std::process::exit(1);
    }
}
