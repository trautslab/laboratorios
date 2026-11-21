// Paso 4 · Preguntar por saldos: la cadena responde por cualquier dirección, exista o no.
use alloy::primitives::{address, utils::format_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};

const DIRECCIONES: [(&str, Address); 3] = [
    ("Cuenta de prueba 0", address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266")),
    ("Cuenta de prueba 1", address!("70997970C51812dc3A010C7d01b50e0d17dc79C8")),
    ("Una que nadie usó ", address!("000000000000000000000000000000000000dEaD")),
];

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    for (nombre, direccion) in DIRECCIONES {
        let Ok(wei) = cadena.get_balance(direccion).await else {
            eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
            std::process::exit(1);
        }; // por dentro: eth_getBalance
        let eth = format_ether(wei);
        println!("{nombre}: {wei} wei = {} ETH", eth.trim_end_matches('0').trim_end_matches('.'));
    }
    println!("\n✔ El saldo no está en la cuenta: lo lleva la cadena, y se lo preguntas a ella.");
    Ok(())
}
