// Paso 4 · Lo que se firmó de verdad: el hash del mensaje con un prefijo delante.
use alloy::primitives::{eip191_hash_message, B256};
use alloy::signers::local::PrivateKeySigner;
use alloy::signers::SignerSync;
use sha3::{Digest, Keccak256};

fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let cuenta: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let mensaje = "Recibí el pedido 42";
    let firma_del_paso_1 = cuenta.sign_message_sync(mensaje.as_bytes())?;

    // El prefijo a mano: el byte 0x19, un texto fijo y la longitud del mensaje en bytes, escrita en decimal.
    let texto = mensaje.as_bytes();
    let prefijo = format!("\x19Ethereum Signed Message:\n{}", texto.len()).into_bytes();
    let todo = [prefijo.as_slice(), texto].concat();
    println!("Prefijo ({} bytes): 0x{}", prefijo.len(), hex::encode(&prefijo));
    println!("Mensaje ({} bytes): 0x{}", texto.len(), hex::encode(texto));

    // Lo que entra a la firma es el hash Keccak-256 de esos bytes juntos: 32 bytes.
    let hash = B256::from_slice(&Keccak256::digest(&todo));
    println!("\nHash hecho a mano:       {hash}");
    println!("Hash que da la librería: {}", eip191_hash_message(mensaje));

    // Firmar ese hash directamente, sin que la librería añada nada, da la firma del paso 1.
    let firma = cuenta.sign_hash_sync(&hash)?;
    println!("\nFirma de ese hash: {firma}");
    println!("Es la firma del paso 1: {}", if firma == firma_del_paso_1 { "sí" } else { "no" });
    println!("Dirección recuperada con el hash:     {}", firma.recover_address_from_prehash(&hash)?);

    // Quien verifica tiene que armar el mismo hash. Si olvida el prefijo, recupera otra dirección.
    let sin_prefijo = B256::from_slice(&Keccak256::digest(texto));
    println!("Dirección recuperada sin el prefijo:  {}", firma.recover_address_from_prehash(&sin_prefijo)?);
    println!("\n✔ «Firmar un mensaje» es firmar keccak256(prefijo + mensaje). El prefijo empieza por 0x19.");
    Ok(())
}
