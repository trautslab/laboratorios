// Paso 6 · Las cuatro, lado a lado: qué tiene el programa, qué hay guardado y qué se lleva quien lo copia.
use alloy::primitives::keccak256;
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use aws_sdk_kms::{Client, Config};
use std::{fs, path::Path};

const LLAVE_DE_PRUEBA: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // n.º 0 de Anvil, PÚBLICA
const TMP: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../donde-vive-la-llave/tmp");
const KMS: &str = "http://localhost:4566";
const ALIAS: &str = "alias/ruta-donde-vive-la-llave";

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let hash = keccak256("Orden de retiro 42: 1 ETH para Ana"); // los mismos 32 bytes del paso 1
    let (archivo, almacen) = (Path::new(TMP).join("llave.txt"), Path::new(TMP).join("almacen.json"));
    let variable = std::env::var("LLAVE_PRIVADA").unwrap_or_default();
    if !archivo.exists() || !almacen.exists() || variable.is_empty() {
        eprintln!("✖ Faltan el archivo, el almacén o la variable LLAVE_PRIVADA. Corre antes los pasos 1 y 3, y lanza este con la variable como en el paso 2.");
        std::process::exit(1);
    }
    // Credenciales FICTICIAS escritas aquí a propósito: el cliente nunca mira las de tu máquina.
    let cliente = format!("endpoint {KMS} · region us-east-1 · credenciales test/test · alias {ALIAS}");
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let configuracion = Config::builder().behavior_version(BehaviorVersion::latest()).region(Region::new("us-east-1")).credentials_provider(credenciales).endpoint_url(KMS);
    let kms = Client::from_conf(configuracion.build());

    // Por lugar: la llave que el programa consigue (o None) y el texto que queda guardado en ese lugar.
    let del_archivo: PrivateKeySigner = fs::read_to_string(&archivo)?.trim().parse()?;
    let del_almacen = PrivateKeySigner::decrypt_keystore(&almacen, "contrasena-de-laboratorio")?; // como en el paso 3
    let lugares = [
        ("1 · archivo en claro", Some(del_archivo), fs::read_to_string(&archivo)?),
        ("2 · variable de entorno", Some(variable.parse()?), format!("LLAVE_PRIVADA={variable}")),
        ("3 · almacén cifrado", Some(del_almacen), fs::read_to_string(&almacen)?),
        ("4 · KMS", None, cliente),
    ];

    println!("Las cuatro, lado a lado. Todas firman el mismo hash: {hash}\n");
    for (nombre, llave, guardado) in &lugares {
        println!("{nombre}");
        println!("  ¿El programa puede imprimir la llave?   {}", if llave.is_some() { "sí" } else { "no" });
        println!("  ¿Lo guardado contiene la llave en claro? {}", if guardado.contains(LLAVE_DE_PRUEBA) { "sí" } else { "no" });
        if let Some(llave) = llave {
            println!("  Firma: 0x{}", hex::encode(llave.sign_hash_sync(&hash)?.as_bytes()));
        } else {
            let peticion = kms.sign().key_id(ALIAS).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest);
            match peticion.signing_algorithm(SigningAlgorithmSpec::EcdsaSha256).send().await {
                Ok(respuesta) => println!("≈ Firma (DER, otra llave): 0x{}", hex::encode(respuesta.signature.map(Blob::into_inner).unwrap_or_default())),
                Err(error) => {
                    eprintln!("✖ El KMS no firmó ({error}). Corre antes el paso 4 y comprueba que el emulador está arrancado.");
                    std::process::exit(1);
                }
            }
        }
    }
    println!("\n✔ En tres lugares el programa termina con la llave en la mano. En el KMS solo puede pedir firmas.");
    Ok(())
}
