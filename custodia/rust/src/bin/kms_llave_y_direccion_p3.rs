// Paso 3 · Pedir la llave pública. Llega en DER: etiquetas, y al final el punto de la curva.
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::{Client, Config};
use k256::ecdsa::VerifyingKey;
use k256::pkcs8::DecodePublicKey;

const ALIAS: &str = "alias/ruta-kms-llave-y-direccion";

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

    let respuesta = match kms.get_public_key().key_id(ALIAS).send().await {
        Ok(respuesta) => respuesta,
        Err(error) if error.as_service_error().is_some_and(|e| e.is_not_found_exception()) => {
            eprintln!("✖ No existe {ALIAS}. Corre antes el paso 1: cargo run -q --bin kms_llave_y_direccion_p1");
            std::process::exit(1);
        }
        Err(_) => {
            eprintln!("✖ No hay KMS en http://localhost:4566. Arranca el emulador: docker run -d --name floci -p 4566:4566 floci/floci:2.5.0");
            std::process::exit(1);
        }
    };
    let der = respuesta.public_key().expect("GetPublicKey devuelve la llave pública").as_ref();
    println!("GetPublicKey devolvió {} bytes en DER\n", der.len());

    // DER guarda cada dato como etiqueta, largo y contenido. En una llave secp256k1 los primeros
    // 23 bytes son siempre los mismos: dicen qué viene. Los 65 que siguen son el punto.
    println!("Etiquetas (23 bytes):");
    println!("  {:<20}secuencia de 86 bytes: todo lo que sigue", hex::encode(&der[0..2]));
    println!("  {:<20}secuencia de 16 bytes: qué tipo de llave es", hex::encode(&der[2..4]));
    println!("  {:<20}identificador: llave pública de curva elíptica", hex::encode(&der[4..13]));
    println!("  {:<20}identificador: la curva secp256k1", hex::encode(&der[13..20]));
    println!("  {:<20}cadena de bits de 66 bytes: un 00 (no sobran bits) y el punto", hex::encode(&der[20..23]));

    let punto = &der[23..]; // 04 ‖ X ‖ Y
    println!("Punto de la curva ({} bytes):", punto.len());
    println!("  {:<20}punto sin comprimir: siguen X e Y, 32 bytes cada una", hex::encode(&punto[0..1]));
    println!("≈ X: 0x{}", hex::encode(&punto[1..33]));
    println!("≈ Y: 0x{}", hex::encode(&punto[33..]));

    // Una librería que entiende DER lee lo mismo sin contar bytes (y rechaza un punto inválido).
    // k256 solo acepta este DER si dice «llave de curva elíptica» y «secp256k1».
    VerifyingKey::from_public_key_der(der)?;
    println!("Leída con una librería: tipo ec, curva secp256k1");
    println!("\n✔ La llave pública son dos números, X e Y. Lo demás son etiquetas.");
    Ok(())
}
