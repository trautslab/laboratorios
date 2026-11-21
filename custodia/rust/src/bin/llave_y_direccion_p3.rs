// Paso 3 · La dirección son los últimos 20 bytes del Keccak-256 de la llave pública.
use k256::elliptic_curve::sec1::ToEncodedPoint;
use sha3::{Digest, Keccak256, Sha3_256};

// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

fn main() {
    let privada = k256::SecretKey::from_slice(&hex::decode(LLAVE).expect("hexadecimal")).expect("un número entre 1 y n − 1");
    let punto = privada.public_key().to_encoded_point(false);
    let completa = punto.as_bytes(); // 04 + x + y
    // El prefijo 04 no entra en la cuenta: el hash se calcula solo sobre x e y, 64 bytes.
    let publica = &completa[1..];
    let hash = Keccak256::digest(publica); // 32 bytes
    let direccion = &hash[12..]; // los últimos 20

    println!("Llave pública sin el prefijo 04: {} bytes", publica.len());
    println!("Keccak-256 de esos bytes ({} bytes):", hash.len());
    println!("  0x{}", hex::encode(hash));
    println!("Se descartan los primeros 12: {}", hex::encode(&hash[..12]));
    println!("Quedan los últimos 20:        {}", hex::encode(direccion));
    println!("Dirección: 0x{}", hex::encode(direccion));

    // Dos errores fáciles. Los dos dan 20 bytes con forma de dirección, pero es otra dirección.
    println!("\nDos errores que dan otra dirección, que esta llave no controla:");
    println!("  dejar el prefijo 04 (65 bytes):  0x{}", hex::encode(&Keccak256::digest(completa)[12..]));
    println!("  usar SHA3-256 en vez de Keccak:  0x{}", hex::encode(&Sha3_256::digest(publica)[12..]));
    println!("\n✔ La dirección se calcula: Keccak-256 de la llave pública, últimos 20 bytes. No se le pide a nadie.");
}
