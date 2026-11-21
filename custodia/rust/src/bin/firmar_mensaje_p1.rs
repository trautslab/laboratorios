// Paso 1 · Firmar un texto corto con una llave y mirar las tres partes de la firma.
use alloy::signers::local::PrivateKeySigner;
use alloy::signers::SignerSync;

fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let cuenta: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let mensaje = "Recibí el pedido 42";

    // Firmar es un cálculo local con la llave: no hay red, no hay transacción y no cuesta nada.
    let firma = cuenta.sign_message_sync(mensaje.as_bytes())?.as_bytes();
    println!("Mensaje:  «{mensaje}» ({} caracteres, {} bytes)", mensaje.chars().count(), mensaje.len());
    println!("Firmante: {}", cuenta.address());
    println!("\nFirma ({} bytes):", firma.len());
    println!("0x{}", hex::encode(firma));

    // La firma son tres valores pegados: r (32 bytes), s (32 bytes) y v (1 byte).
    println!("  r: 0x{}", hex::encode(&firma[..32]));
    println!("  s: 0x{}", hex::encode(&firma[32..64]));
    println!("  v: 0x{:02x} ({})", firma[64], firma[64]);

    // Con la misma llave y el mismo mensaje, la firma sale igual cada vez.
    let otra_vez = cuenta.sign_message_sync(mensaje.as_bytes())?.as_bytes();
    println!("\nFirmar otra vez el mismo mensaje da la misma firma: {}", if otra_vez == firma { "sí" } else { "no" });
    println!("\n✔ La firma son 65 bytes: r, s y v. Este script no habló con ninguna red.");
    Ok(())
}
