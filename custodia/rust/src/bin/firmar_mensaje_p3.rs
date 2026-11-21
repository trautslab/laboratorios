// Paso 3 · Cambiar un carácter del mensaje y verificar con la misma firma.
use alloy::primitives::{address, Signature};

fn main() -> eyre::Result<()> {
    // La firma del paso 1 y la dirección de quien se espera. Tampoco aquí hay llave privada.
    let firma: Signature = "0x49a0332a5c97b6f6494789dde783fc5d99705c7804d52acffc07019b21f5e1b239f457444fa127b4f7462e85ce141ef5cfdeec9b1bd23a288dcffa3c639dd7de1b".parse()?;
    let esperada = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // El mensaje firmado y dos variantes: otro número de pedido y un espacio de más al final.
    let mensajes = ["Recibí el pedido 42", "Recibí el pedido 43", "Recibí el pedido 42 "];

    println!("Dirección esperada: {esperada}\n");
    for mensaje in mensajes {
        // La recuperación no falla con un mensaje distinto: devuelve otra dirección.
        let recuperada = firma.recover_address_from_msg(mensaje)?;
        let coincide = recuperada == esperada;
        println!("«{mensaje}»");
        println!("  dirección recuperada: {recuperada}");
        println!("  {}", if coincide { "coincide: la firma vale para este mensaje" } else { "no coincide: la firma no vale para este mensaje" });
    }
    println!("\n✔ Una firma vale para unos bytes exactos. Con otro mensaje no hay error: sale otra dirección.");
    Ok(())
}
