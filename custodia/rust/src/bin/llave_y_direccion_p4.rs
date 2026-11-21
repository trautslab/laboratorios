// Paso 4 · El checksum EIP-55: las mayúsculas de una dirección sirven para detectar un error de copia.
use alloy::primitives::Address;
use sha3::{Digest, Keccak256};

// La dirección del paso 3, en minúsculas y sin 0x.
const DIRECCION: &str = "f39fd6e51aad88f6f4ce6ab8827279cfffb92266";

// El hash se calcula sobre el TEXTO de la dirección (40 caracteres en minúsculas), no sobre sus 20 bytes.
fn hash_de(minusculas: &str) -> String {
    hex::encode(Keccak256::digest(minusculas.as_bytes()))[..40].to_string()
}

// La regla: cada letra va en mayúscula si el dígito del hash en su misma posición es 8 o más.
fn con_checksum(direccion: &str) -> String {
    let minusculas = direccion.to_lowercase();
    let hash = hash_de(&minusculas);
    minusculas.chars().zip(hash.chars()).map(|(letra, digito)| if digito >= '8' { letra.to_ascii_uppercase() } else { letra }).collect()
}

fn main() {
    let resultado = con_checksum(DIRECCION);
    println!("Cada carácter de la dirección, sobre el dígito del hash en su misma posición:");
    println!("  dirección: {DIRECCION}");
    println!("  hash:      {}", hash_de(DIRECCION));
    println!("  resultado: {resultado}");
    println!("Con checksum: 0x{resultado}");
    let letras = DIRECCION.chars().filter(|c| *c >= 'a').count();
    println!("Letras (a-f): {letras}. En mayúscula quedaron {}.", resultado.chars().filter(|c| c.is_ascii_uppercase()).count());

    // Alguien copia mal el último carácter: un 6 se vuelve 7.
    let mal_copiada = format!("{}7", &resultado[..39]);
    println!("\nUn error de copia en el último carácter (6 → 7):");
    println!("  texto recibido:            0x{mal_copiada}");
    println!("  checksum de esa dirección: 0x{}", con_checksum(&mal_copiada));
    println!("  A mano: {}", if con_checksum(&mal_copiada) == mal_copiada { "coinciden" } else { "no coinciden, el texto está mal copiado" });
    // `parse_checksummed` exige el checksum exacto. Un `parse` normal no mira las mayúsculas.
    let estricta = Address::parse_checksummed(format!("0x{mal_copiada}"), None);
    println!("  La librería: {}", if estricta.is_ok() { "la acepta" } else { "la rechaza" });

    // El mismo error en un texto todo en minúsculas: no hay mayúsculas que comparar.
    let en_minusculas = mal_copiada.to_lowercase();
    println!("\nEl mismo error, con todo en minúsculas:");
    println!("  texto recibido: 0x{en_minusculas}");
    let sin_checksum = format!("0x{en_minusculas}").parse::<Address>();
    println!("  La librería: {}", if sin_checksum.is_ok() { "la acepta" } else { "la rechaza" });
    println!("\n✔ El checksum va en las mayúsculas: delata un carácter mal copiado. Una dirección en minúsculas no lleva ninguno.");
}
