// Paso 1 · Dos firmas normales: cada una lleva un r distinto, porque cada una usó un número secreto distinto.
use k256::ecdsa::signature::hazmat::PrehashSigner;
use k256::ecdsa::{Signature, SigningKey};
use sha3::{Digest, Keccak256};

// Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca le envíes fondos reales.
const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Se firma el hash del mensaje, no el texto. La firma son 64 bytes: los 32 de r y los 32 de s.
fn firmar(llave: &SigningKey, mensaje: &str) -> eyre::Result<(String, String)> {
    let hash = Keccak256::digest(mensaje.as_bytes());
    let firma: Signature = llave.sign_prehash(&hash)?;
    let bytes = firma.to_bytes();
    Ok((hex::encode(&bytes[..32]), hex::encode(&bytes[32..])))
}

fn main() -> eyre::Result<()> {
    let llave = SigningKey::from_slice(&hex::decode(LLAVE)?)?;
    let mensaje1 = "retiro 1: 5 ETH a la cuenta A";
    let mensaje2 = "retiro 2: 7 ETH a la cuenta B";
    let firma1 = firmar(&llave, mensaje1)?;
    let firma2 = firmar(&llave, mensaje2)?;
    let otra_vez = firmar(&llave, mensaje1)?;
    let si_no = |valor: bool| if valor { "sí" } else { "no" };

    println!("Mensaje 1: \"{mensaje1}\"");
    println!("  r = 0x{}\n  s = 0x{}", firma1.0, firma1.1);
    println!("Mensaje 2: \"{mensaje2}\"");
    println!("  r = 0x{}\n  s = 0x{}", firma2.0, firma2.1);
    println!("r distinto en las dos firmas: {}", si_no(firma1.0 != firma2.0));

    println!("\nMensaje 1, firmado otra vez");
    println!("  r = 0x{}\n  s = 0x{}", otra_vez.0, otra_vez.1);
    println!("Misma firma que la primera vez: {}", si_no(otra_vez == firma1));

    println!("\n✔ Mensajes distintos, r distintos. El mismo mensaje da la misma firma: la librería no usa azar, calcula el número secreto.");
    Ok(())
}
