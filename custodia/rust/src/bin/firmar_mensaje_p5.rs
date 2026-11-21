// Paso 5 · Una aprobación firmada fuera de la cadena y el servicio que la comprueba.
use alloy::primitives::{address, Address, Signature};
use alloy::signers::local::PrivateKeySigner;
use alloy::signers::SignerSync;

// El servicio solo guarda direcciones: las de quienes pueden aprobar (cuentas de prueba 0 y 1).
const PERMITIDAS: [Address; 2] = [address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"), address!("70997970C51812dc3A010C7d01b50e0d17dc79C8")];

// Lo que hace el servicio con cada aprobación que recibe: recuperar quién firmó y buscarlo en la lista.
fn revisar(texto: &str, firma: &Signature) -> eyre::Result<()> {
    let quien = firma.recover_address_from_msg(texto)?;
    let permitido = PERMITIDAS.contains(&quien);
    println!("«{texto}»");
    println!("  firmó: {quien}");
    println!("  {}", if permitido { "está en la lista: APROBADO" } else { "no está en la lista: RECHAZADO" });
    Ok(())
}

fn main() -> eyre::Result<()> {
    // Llaves de las cuentas de prueba 0 y 2 de Anvil. Son públicas: nunca las uses con fondos reales.
    let aprobadora: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let extrano: PrivateKeySigner = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a".parse()?;

    let retiro = "Apruebo el retiro R-17 por 5 ETH";
    let firma_valida = aprobadora.sign_message_sync(retiro.as_bytes())?;
    println!("1. Firmado por una aprobadora de la lista");
    revisar(retiro, &firma_valida)?;
    println!("\n2. Firmado por alguien que no está en la lista");
    revisar(retiro, &extrano.sign_message_sync(retiro.as_bytes())?)?;
    println!("\n3. La firma del caso 1 con el monto cambiado");
    revisar("Apruebo el retiro R-17 por 50 ETH", &firma_valida)?;
    println!("\n✔ El servicio aprobó una de tres sin guardar ninguna llave: solo una lista de direcciones.");
    Ok(())
}
