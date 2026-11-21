// Paso 5 · Un programa que solo conoce la llave pública extendida y lista direcciones para recibir.
// En Rust esto lo hace el crate coins-bip32 (XPub y derive_child). alloy lo usa por dentro pero no lo
// reexporta, así que aquí la derivación pública de BIP-32 va a mano, con k256 y SHA-512.
use alloy::primitives::Address;
use k256::elliptic_curve::{sec1::ToEncodedPoint, PrimeField};
use k256::sha2::{Digest, Sha256, Sha512};
use k256::{ecdsa::VerifyingKey, ProjectivePoint, PublicKey, Scalar};

// Lo único que este programa conoce: el texto que exportó 5-exportar-xpub.mjs. Aquí no hay frase.
const XPUB: &str = "xpub6Ce9NcJvTk36xtLSrJLZqE7wtgA5deCeYs7rSQtreh4cj6ByPtrg9sD7V2FNFLPnf8heNP3FGkeV9qwfzvZNSd54JoNXVsXFYSYwHsnJxqP";

// Base58 → bytes. Una llave extendida son 78 bytes de campos y 4 de comprobación.
fn base58(texto: &str) -> [u8; 82] {
    let mut bytes = [0u8; 82];
    for letra in texto.chars() {
        let mut resto = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".find(letra).expect("no es Base58") as u32;
        for byte in bytes.iter_mut().rev() {
            resto += 58 * *byte as u32;
            (*byte, resto) = (resto as u8, resto >> 8);
        }
    }
    bytes
}

// HMAC-SHA512 para llaves de hasta 128 bytes: dos pasadas de SHA-512.
fn hmac_sha512(llave: &[u8], datos: &[u8]) -> [u8; 64] {
    let mut bloque = [0u8; 128];
    bloque[..llave.len()].copy_from_slice(llave);
    let interno = Sha512::new().chain_update(bloque.map(|b| b ^ 0x36)).chain_update(datos).finalize();
    Sha512::new().chain_update(bloque.map(|b| b ^ 0x5c)).chain_update(interno).finalize().into()
}

// Hija sin apóstrofo: HMAC del código de cadena sobre (llave pública del padre, índice) y una suma de puntos.
fn hija(padre: &PublicKey, codigo: &[u8], indice: u32) -> Option<(PublicKey, Vec<u8>)> {
    if indice >= 0x8000_0000 {
        return None; // con apóstrofo, en el HMAC entra la llave privada del padre, y aquí no está
    }
    let mezcla = hmac_sha512(codigo, &[padre.to_encoded_point(true).as_bytes(), &indice.to_be_bytes()].concat());
    let suma = Option::<Scalar>::from(Scalar::from_repr(<[u8; 32]>::try_from(&mezcla[..32]).ok()?.into()))?;
    let punto = ProjectivePoint::GENERATOR * suma + padre.to_projective();
    Some((PublicKey::from_affine(punto.to_affine()).ok()?, mezcla[32..].to_vec()))
}

fn main() -> eyre::Result<()> {
    let campos = base58(XPUB); // nivel en el byte 4, código de cadena en 13..45, llave pública en 45..78
    eyre::ensure!(Sha256::digest(Sha256::digest(&campos[..78]))[..4] == campos[78..], "la comprobación del texto no coincide");
    let (cuenta, codigo) = (PublicKey::from_sec1_bytes(&campos[45..78])?, &campos[13..45]);
    let direccion = |llave: &PublicKey| Address::from_public_key(&VerifyingKey::from(llave));

    println!("Entrada: {}…{} (nivel {} del árbol, m/44'/60'/0')", &XPUB[..12], &XPUB[XPUB.len() - 6..], campos[4]);
    println!("  llave pública    0x{}", hex::encode(&campos[45..78]));
    println!("  código de cadena 0x{}\n", hex::encode(codigo));

    // Dos pasos sin apóstrofo: «/0» (direcciones para recibir) y el índice. Solo usan datos públicos.
    let (recibir, codigo_recibir) = hija(&cuenta, codigo, 0).ok_or_else(|| eyre::eyre!("hija no válida"))?;
    for i in 0..3 {
        let (llave, _) = hija(&recibir, &codigo_recibir, i).ok_or_else(|| eyre::eyre!("hija no válida"))?;
        println!("m/44'/60'/0'/0/{i} → {}", direccion(&llave));
    }

    // Un paso con apóstrofo necesita la llave privada del padre, y aquí no está.
    match hija(&cuenta, codigo, 0x8000_0000) {
        Some(_) => println!("\nHija con apóstrofo (0'): calculada"),
        None => println!("\nHija con apóstrofo (0'): no se puede calcular sin la llave privada del padre"),
    }
    println!("\n✔ Con la llave pública extendida salen las direcciones, pero ninguna llave para firmar.");
    Ok(())
}
