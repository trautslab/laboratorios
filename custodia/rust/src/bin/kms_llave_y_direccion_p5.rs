// Paso 5 · Comprobar la dirección: KMS firma un hash y de la firma se recupera quién firmó.
use alloy::primitives::{keccak256, Address};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::{Client, Config};
use k256::ecdsa::{RecoveryId, Signature, VerifyingKey};

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
    let direccion = Address::from_raw_public_key(&der[der.len() - 64..]);
    let hash = keccak256("hola, KMS"); // un hash fijo de 32 bytes: no es una transacción
    println!("≈ Dirección calculada desde la llave pública: {direccion}");
    println!("Hash de prueba (32 bytes): {hash}\n");

    // DIGEST: lo que se envía ya es un hash, KMS no lo vuelve a hashear. Responde con r y s en DER.
    let pedido = kms.sign().key_id(ALIAS).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest);
    let firmado = pedido.signing_algorithm(SigningAlgorithmSpec::EcdsaSha256).send().await?;
    let firma_der = firmado.signature().expect("Sign devuelve la firma").as_ref();
    let firma = Signature::from_der(firma_der)?;
    println!("Sign devolvió una firma en DER: dos números, r y s");
    println!("≈ Largo de la firma: {} bytes", firma_der.len());
    println!("≈ r: 0x{}", hex::encode(firma.r().to_bytes()));

    // Ethereum solo acepta la mitad baja de s en una transacción (EIP-2). N − s es igual de válida.
    let baja = firma.normalize_s(); // devuelve la firma con N − s solo si s llegó en la mitad alta
    let firma = baja.unwrap_or(firma);
    println!("≈ s: 0x{}", hex::encode(firma.s().to_bytes()));
    println!("≈ s llegó en la mitad alta: {}", if baja.is_some() { "sí, se cambió por N − s" } else { "no" });

    // A la firma le falta un dato para recuperar al firmante: 0 o 1. KMS no lo da; se prueban los dos.
    let mut acierto = "ninguno".to_string();
    for id in 0..2u8 {
        let llave = VerifyingKey::recover_from_prehash(hash.as_slice(), &firma, RecoveryId::from_byte(id).expect("0 o 1"))?;
        let recuperada = Address::from_public_key(&llave);
        println!("≈ Recuperada con {id}: {recuperada}");
        if recuperada == direccion { acierto = id.to_string(); }
    }
    println!("≈ Id de recuperación que acierta: {acierto}");
    println!("La dirección recuperada coincide con la calculada: {}", if acierto == "ninguno" { "no" } else { "sí" });
    println!("\n✔ El KMS firma con la llave privada de esa dirección. Tú pediste una firma y no la viste.");
    Ok(())
}
