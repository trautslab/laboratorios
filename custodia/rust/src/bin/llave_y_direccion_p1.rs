// Paso 1 · Una llave privada es un número de 32 bytes: pídelo al azar y comprueba que sirve.
use alloy::primitives::{uint, U256};
use k256::elliptic_curve::rand_core::{OsRng, RngCore};

// n es el orden de la curva secp256k1: una constante pública. Una llave válida está entre 1 y n − 1.
const N: U256 = uint!(0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141_U256);

// La regla, a mano: 32 bytes leídos como un solo número, mayor que 0 y menor que n.
fn sirve(bytes: &[u8]) -> bool {
    let numero = U256::from_be_slice(bytes);
    bytes.len() == 32 && numero >= U256::from(1) && numero < N
}

fn texto(ok: bool) -> &'static str {
    if ok { "sirve" } else { "no sirve" }
}

fn main() {
    // 32 bytes del generador del sistema operativo.
    let mut llave = [0u8; 32];
    OsRng.fill_bytes(&mut llave);
    while !sirve(&llave) {
        OsRng.fill_bytes(&mut llave); // repetir es casi imposible: menos de 1 caso en 2^127
    }

    println!("Pido 32 bytes al azar. Eso es toda la llave privada:");
    println!("≈ Llave generada: 0x{}", hex::encode(llave));
    println!("Largo: {} bytes ({} caracteres hexadecimales)", llave.len(), hex::encode(llave).len());
    println!("Límite n de la curva: 0x{N:x}");
    println!("¿Está entre 1 y n − 1? {}", if sirve(&llave) { "sí" } else { "no" });

    // La misma regla con cuatro números conocidos, y lo que dice la librería de curvas de cada uno.
    println!("\n  número   a mano     librería");
    for (nombre, numero) in [("0", U256::ZERO), ("1", U256::from(1)), ("n − 1", N - U256::from(1)), ("n", N)] {
        let bytes = numero.to_be_bytes::<32>();
        println!("  {nombre:<8} {:<10} {}", texto(sirve(&bytes)), texto(k256::SecretKey::from_slice(&bytes).is_ok()));
    }
    println!("\n✔ Una llave privada es un número de 32 bytes entre 1 y n − 1. Salió de tu máquina y nadie más lo sabe.");
}
