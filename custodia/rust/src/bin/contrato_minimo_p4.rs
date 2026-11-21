// Paso 4 · Leer: eth_call ejecuta la función en el nodo, sin transacción y sin pagar.
use alloy::primitives::{address, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::sol;
use alloy::sol_types::SolCall;

sol!(#[sol(rpc)] Contador, "../contrato-minimo/contratos/out/Contador.json");

const CONTADOR: Address = address!("8464135c8F25Da09e49BC8782676a84730C318bC"); // donde quedó en el paso 3

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);
    let Ok(antes) = cadena.get_block_number().await else {
        eprintln!("✖ No hay contrato en esa dirección. Corre antes el paso 3 sobre una cadena nueva.");
        std::process::exit(1);
    };
    let datos = Contador::valorCall {}.abi_encode();
    println!("Datos de la llamada: 0x{} (4 bytes: solo el selector)", hex::encode(&datos));

    let peticion = TransactionRequest::default().to(CONTADOR).input(datos.into());
    let respuesta = cadena.call(peticion).await?; // por dentro: eth_call
    println!("Respuesta cruda: 0x{}", hex::encode(&respuesta));
    println!("Decodificada: valor = {}", Contador::valorCall::abi_decode_returns(&respuesta)?);

    let despues = cadena.get_block_number().await?;
    println!("Bloque antes: {antes} · bloque después: {despues}");
    println!("\n✔ Leer no crea transacción: no hay hash, ni bloque nuevo, ni comisión.");
    Ok(())
}
