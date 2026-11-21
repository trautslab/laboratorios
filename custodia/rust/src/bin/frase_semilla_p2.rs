// Paso 2 · La frase es un número escrito con palabras. De ella sale la semilla.
use alloy::signers::local::coins_bip39::{English, Mnemonic, Wordlist};
use k256::sha2::{Digest, Sha256};

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE: &str = "test test test test test test test test test test test junk";

fn main() -> eyre::Result<()> {
    let once = FRASE.split(' ').take(11).collect::<Vec<_>>().join(" ");
    let posicion = |palabra: &str| English::get_index(palabra).unwrap_or_default();

    println!("Frase: {FRASE}\n");
    println!("Cada palabra es su posición en una lista fija de 2048 palabras: 11 bits.");
    for palabra in ["test", "junk"] {
        println!("  {palabra} → {} = {:011b}", posicion(palabra), posicion(palabra));
    }

    // 12 palabras × 11 bits = 132 bits: 128 son el número y los 4 últimos lo comprueban.
    let frase = Mnemonic::<English>::new_from_phrase(FRASE)?; // devuelve un error si la comprobación no coincide
    let numero = frase.entropy().as_bytes();
    println!("\nEl número, 128 bits: 0x{}", hex::encode(numero));
    println!("Comprobación, 4 bits: {:04b} al final de «junk»", posicion("junk") & 0b1111);
    println!("Debe ser el principio de SHA-256(número): {:04b}", Sha256::digest(numero)[0] >> 4);

    // Cambiar la última palabra por otra de la lista casi siempre rompe la comprobación.
    println!("\nLas 11 primeras palabras iguales y otra al final:");
    for ultima in ["junk", "just", "absent"] {
        let valida = Mnemonic::<English>::new_from_phrase(&format!("{once} {ultima}")).is_ok();
        println!("  … test {ultima:<6} → {}", if valida { "válida" } else { "rechazada: la comprobación no coincide" });
    }
    let validas = English::get_all().iter().filter(|ultima| Mnemonic::<English>::new_from_phrase(&format!("{once} {ultima}")).is_ok()).count();
    println!("  De las 2048 palabras posibles al final, {validas} dan una frase válida.");

    // La semilla sale del texto de la frase: PBKDF2 con HMAC-SHA512, 2048 vueltas, 64 bytes.
    let semilla = frase.to_seed(None)?;
    println!("\nSemilla, {} bytes:\n  0x{}\n    {}", semilla.len(), hex::encode(&semilla[..32]), hex::encode(&semilla[32..]));
    println!("\n✔ 12 palabras son 128 bits más 4 de comprobación, y de la frase sale una semilla de 64 bytes.");
    Ok(())
}
