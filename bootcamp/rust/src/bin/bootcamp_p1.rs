// Paso 1 · La huella de un documento: SHA-256 y Keccak-256, y qué pasa al cambiar un carácter.
use bootcamp::{hex0x, DOCUMENTOS};
use sha2::Sha256;
use sha3::{Digest, Keccak256, Sha3_256};
use std::collections::HashMap;

fn sha256(d: &[u8]) -> Vec<u8> { Sha256::digest(d).to_vec() }
fn keccak(d: &[u8]) -> Vec<u8> { Keccak256::digest(d).to_vec() }

// Cuántos bits distintos hay entre dos secuencias de bytes del mismo largo.
fn bits_distintos(a: &[u8], b: &[u8]) -> u32 {
    a.iter().zip(b).map(|(x, y)| (x ^ y).count_ones()).sum()
}

fn main() {
    let original = DOCUMENTOS[0];
    let cambiado = original.replace("nota 6.5", "nota 6.8"); // un solo carácter distinto
    let (o, c) = (original.as_bytes(), cambiado.as_bytes());

    println!("Documento: «{original}» ({} bytes)", o.len());
    println!("  SHA-256:    {}", hex0x(&sha256(o)));
    println!("  Keccak-256: {}", hex0x(&keccak(o)));
    println!("  SHA3-256:   {}", hex0x(&Sha3_256::digest(o)));
    println!("  (Keccak-256 es la de Ethereum; SHA3-256 es el estándar del NIST: otro relleno, otra huella)");

    // Un millón de bytes también dan 32: la huella mide lo mismo sea cual sea el documento.
    println!("\nUn documento de 1000000 bytes también da una huella de {} bytes.", keccak(&vec![0u8; 1_000_000]).len());

    println!("\nDocumento cambiado: «{cambiado}»");
    println!("  SHA-256:    {}", hex0x(&sha256(c)));
    println!("  Keccak-256: {}", hex0x(&keccak(c)));

    println!("\nBits distintos entre los dos documentos: {} de {}", bits_distintos(o, c), o.len() * 8);
    println!("Bits distintos entre las dos huellas (de 256):");
    println!("  SHA-256:    {}", bits_distintos(&sha256(o), &sha256(c)));
    println!("  Keccak-256: {}", bits_distintos(&keccak(o), &keccak(c)));

    // La huella como identificador: un índice huella → documento. Verificar es recalcular y buscar.
    let indice: HashMap<String, &str> = DOCUMENTOS.iter().map(|t| (hex0x(&keccak(t.as_bytes())), *t)).collect();
    let buscar = |texto: &str| indice.get(&hex0x(&keccak(texto.as_bytes()))).copied();
    println!("\nÍndice con {} documentos, buscados por su huella Keccak-256:", indice.len());
    println!("  el original: {}", if buscar(original) == Some(original) { "encontrado" } else { "no está" });
    println!("  el cambiado: {}", buscar(&cambiado).unwrap_or("no está"));
    println!("\n✔ Una huella de 32 bytes identifica al documento: un carácter distinto da otra huella.");
}
