// Paso 5 · ¿Cuenta o contrato? Se decide con una sola pregunta: si la dirección tiene código.
use alloy::primitives::{address, Address};
use alloy::providers::{Provider, ProviderBuilder};

const DIRECCIONES: [(&str, Address); 3] = [
    ("Cuenta de prueba 0 ", address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266")),
    ("Dirección inventada", address!("1234567890123456789012345678901234567890")),
    ("Alcancía del paso 4", address!("8464135c8F25Da09e49BC8782676a84730C318bC")),
];

// Una dirección es un contrato si la cadena guarda código para ella.
async fn cuenta_o_contrato(cadena: &impl Provider, direccion: Address) -> eyre::Result<String> {
    let codigo = cadena.get_code_at(direccion).await?; // por dentro: eth_getCode
    Ok(if codigo.is_empty() { "cuenta, sin código".to_string() } else { format!("contrato, {} bytes de código", codigo.len()) })
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    for (nombre, direccion) in DIRECCIONES {
        let Ok(tipo) = cuenta_o_contrato(&cadena, direccion).await else {
            eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
            std::process::exit(1);
        };
        println!("{nombre}: {tipo}");
    }
    println!("\n✔ Sin código, la mueve una llave (si alguien la tiene). Con código, manda el código.");
    Ok(())
}
