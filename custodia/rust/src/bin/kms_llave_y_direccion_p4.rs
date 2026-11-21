// Paso 4 · De la llave pública a la dirección: Keccak-256 de X ‖ Y, los últimos 20 bytes.
use alloy::primitives::Address;
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::{Client, Config};
use sha3::{Digest, Keccak256};

const ALIAS: &str = "alias/ruta-kms-llave-y-direccion";

// EIP-55: se hashea el texto de la dirección en minúsculas (sin 0x). Cada letra pasa a mayúscula
// si el dígito del hash que está en su misma posición es 8 o más. Los 20 bytes no cambian.
fn con_mayusculas_de_control(digitos: &str) -> String {
    let hash = hex::encode(Keccak256::digest(digitos.as_bytes()));
    let letras = digitos.chars().zip(hash.chars());
    let con_control: String = letras.map(|(letra, h)| if h >= '8' { letra.to_ascii_uppercase() } else { letra }).collect();
    format!("0x{con_control}")
}

#[tokio::main]
async fn main() {
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
    let xy = &der[der.len() - 64..]; // el punto sin su primer byte, el 04
    let hash = Keccak256::digest(xy);
    let ultimos20 = &hash[12..];
    let direccion = con_mayusculas_de_control(&hex::encode(ultimos20));

    println!("Entrada: X ‖ Y, {} bytes (el punto sin el 04)", xy.len());
    println!("≈ X ‖ Y: 0x{}", hex::encode(xy));
    println!("Keccak-256 de esos {} bytes: {} bytes", xy.len(), hash.len());
    println!("≈ Hash: 0x{}", hex::encode(hash));
    println!("La dirección son los últimos {} bytes del hash", ultimos20.len());
    println!("≈ En minúsculas: 0x{}", hex::encode(ultimos20));
    println!("≈ Con mayúsculas de control (EIP-55): {direccion}");

    // La librería hace el mismo cálculo a partir de X ‖ Y.
    let con_libreria = Address::from_raw_public_key(xy).to_checksum(None);
    println!("La librería calcula la misma dirección: {}", if con_libreria == direccion { "sí" } else { "no" });
    println!("\n✔ La dirección se calcula: no hay que registrarla en ningún sitio ni ver la llave privada.");
}
