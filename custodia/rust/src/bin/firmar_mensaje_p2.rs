// Paso 2 · Verificar una firma sin tener ninguna llave: recuperar la dirección y compararla.
use alloy::primitives::{address, Signature};

fn main() -> eyre::Result<()> {
    // Lo que recibe quien verifica: el mensaje y la firma del paso 1. En este archivo no hay llave privada.
    let mensaje = "Recibí el pedido 42";
    let firma: Signature = "0x49a0332a5c97b6f6494789dde783fc5d99705c7804d52acffc07019b21f5e1b239f457444fa127b4f7462e85ce141ef5cfdeec9b1bd23a288dcffa3c639dd7de1b".parse()?;
    // Lo que ya sabía por otro canal: de quién espera la firma.
    let esperada = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // Del mensaje y la firma sale la dirección de quien firmó. No se le pregunta a nadie.
    let recuperada = firma.recover_address_from_msg(mensaje)?;
    let coincide = recuperada == esperada;
    println!("Mensaje:              «{mensaje}»");
    println!("Firma:                {firma}");
    println!("Dirección recuperada: {recuperada}");
    println!("Dirección esperada:   {esperada}");
    println!("Coinciden:            {}", if coincide { "sí" } else { "no" });
    if coincide {
        println!("\n✔ La firma es de quien tiene la llave de esa dirección. Para comprobarlo no hizo falta ningún secreto.");
    } else {
        println!("\n✖ La firma no es de la dirección esperada.");
    }
    Ok(())
}
