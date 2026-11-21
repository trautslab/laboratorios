// Paso 4 (preparación) · Pone en la cadena el contrato de prueba Caja. Es un programa ya hecho:
// cómo se sube un contrato se explica en el laboratorio 19 de la ruta.
use alloy::primitives::{address, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::PrivateKeySigner;
use alloy::sol;

// El contrato ya compilado (lib/compilar.mjs).
sol!(#[sol(rpc)] Caja, "../errores-por-capa/contratos/out/Caja.json");

// Llave PÚBLICA de la cuenta de prueba 9 de Anvil. Solo sube la Caja: así su primer contrato
// queda siempre en la misma dirección.
const LLAVE: &str = "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";
const CAJA: Address = address!("700b6A60ce7EaaEA56F065753d8dcB9653dbAD35");

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cuenta: PrivateKeySigner = LLAVE.parse()?;
    let billetera = ProviderBuilder::new().wallet(cuenta).connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(codigo) = billetera.get_code_at(CAJA).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    // Si ya está (corriste este programa antes), no la sube otra vez.
    if codigo.is_empty() {
        Caja::deploy(&billetera).await?;
    }
    let codigo = billetera.get_code_at(CAJA).await?;
    if codigo.is_empty() {
        eprintln!("✖ La cuenta de prueba 9 ya se usó en esta cadena. Reinicia Anvil y repite.");
        std::process::exit(1);
    }
    println!("Contrato Caja en {CAJA}");
    println!("Código en esa dirección: {} bytes", codigo.len());
    println!("\n✔ La Caja está en la cadena. Su función retirar(monto) revierte si el total pasa de 100.");
    Ok(())
}
