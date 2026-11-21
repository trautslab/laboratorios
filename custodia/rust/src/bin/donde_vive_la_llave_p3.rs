// Paso 3 · Un almacén cifrado (Web3 Secret Storage v3): el archivo solo no alcanza, hace falta la contraseña.
use alloy::primitives::keccak256;
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use k256::elliptic_curve::rand_core::{CryptoRng, Error, RngCore};
use std::{fs, path::Path};

const LLAVE_DE_PRUEBA: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // n.º 0 de Anvil, PÚBLICA
const CONTRASENA: &str = "contrasena-de-laboratorio";
const TMP: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../donde-vive-la-llave/tmp");

// La librería pide al azar 32 bytes para la sal y 16 para el IV. Aquí van fijos para que el
// archivo salga igual en cada corrida. Un almacén real los saca del azar: usa `rand::thread_rng()`.
struct SalEIvFijos;
impl CryptoRng for SalEIvFijos {}
impl RngCore for SalEIvFijos {
    fn fill_bytes(&mut self, destino: &mut [u8]) {
        destino.fill(if destino.len() == 32 { 0x11 } else { 0x22 });
    }
    fn try_fill_bytes(&mut self, destino: &mut [u8]) -> Result<(), Error> {
        self.fill_bytes(destino);
        Ok(())
    }
    fn next_u32(&mut self) -> u32 {
        0
    }
    fn next_u64(&mut self) -> u64 {
        0
    }
}

fn main() -> eyre::Result<()> {
    let hash = keccak256("Orden de retiro 42: 1 ETH para Ana"); // los mismos 32 bytes del paso 1
    let almacen = Path::new(TMP).join("almacen.json");

    // Cifrar: scrypt, AES-128-CTR y la MAC. En el archivo no queda ni la llave ni la contraseña.
    fs::create_dir_all(TMP)?;
    PrivateKeySigner::encrypt_keystore(TMP, &mut SalEIvFijos, hex::decode(LLAVE_DE_PRUEBA)?, CONTRASENA, Some("almacen.json"))?;

    let texto = fs::read_to_string(&almacen)?;
    let json: serde_json::Value = serde_json::from_str(&texto)?;
    let (crypto, kdf) = (&json["crypto"], &json["crypto"]["kdfparams"]);
    println!("Lugar 3 · un almacén cifrado (Web3 Secret Storage, versión 3)");
    println!("  Archivo:    donde-vive-la-llave/tmp/almacen.json");
    println!("  kdf:        {} · n {} · r {} · p {}", crypto["kdf"].as_str().unwrap_or("?"), kdf["n"], kdf["r"], kdf["p"]);
    println!("  salt:       {}", kdf["salt"].as_str().unwrap_or("?"));
    println!("  cipher:     {} · iv {}", crypto["cipher"].as_str().unwrap_or("?"), crypto["cipherparams"]["iv"].as_str().unwrap_or("?"));
    println!("  ciphertext: {}", crypto["ciphertext"].as_str().unwrap_or("?"));
    println!("  mac:        {}", crypto["mac"].as_str().unwrap_or("?"));
    println!("≈ id: {}", json["id"].as_str().unwrap_or("?"));
    println!("  ¿Aparece la llave en el archivo? {}", if texto.contains(LLAVE_DE_PRUEBA) { "sí" } else { "no" });

    // Abrir: derivar otra vez, comparar la MAC y solo entonces descifrar. La librería hace las tres cosas.
    println!("\nAbrir el almacén");
    match PrivateKeySigner::decrypt_keystore(&almacen, "otra-contrasena") {
        Err(error) if error.to_string() == "Mac Mismatch" => println!("  Con otra contraseña: no abre, la MAC no coincide"),
        otro => println!("  Con otra contraseña: resultado inesperado, {otro:?}"),
    }
    let llave = PrivateKeySigner::decrypt_keystore(&almacen, CONTRASENA)?;
    println!("  Con la contraseña correcta: abre, {} bytes de llave", llave.to_bytes().len());

    let firma = llave.sign_hash_sync(&hash)?;
    println!("\nFirmar con la llave descifrada");
    println!("  Hash:      {hash}");
    println!("  Dirección: {}", llave.address());
    println!("  Firma:     0x{}", hex::encode(firma.as_bytes()));

    println!("\nDónde está la llave");
    println!("  En el disco: cifrada. Quien copia el archivo necesita además la contraseña.");
    println!("  En la memoria del programa: en claro, desde que abre el almacén.");
    println!("✔ Almacén cifrado: el archivo solo no firma. Con la contraseña, la llave vuelve a estar en tu proceso.");
    Ok(())
}
