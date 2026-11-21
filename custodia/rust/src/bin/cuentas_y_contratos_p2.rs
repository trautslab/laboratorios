// Paso 2 · Lo que la cadena guarda de una dirección: saldo, nonce y código.
use alloy::primitives::{address, utils::format_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};

const CUENTA: Address = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // la cuenta de prueba 0 de Anvil

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(saldo) = cadena.get_balance(CUENTA).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }; // por dentro: eth_getBalance
    let nonce = cadena.get_transaction_count(CUENTA).await?; // por dentro: eth_getTransactionCount
    // Sin código, alloy devuelve una lista de bytes vacía. El nodo envía «0x»: cero bytes.
    let codigo = cadena.get_code_at(CUENTA).await?; // por dentro: eth_getCode

    println!("Cuenta de prueba 0: {CUENTA}\n");
    let eth = format_ether(saldo);
    println!("Saldo:  {saldo} wei = {} ETH", eth.trim_end_matches('0').trim_end_matches('.'));
    println!("Nonce:  {nonce}");
    println!("Código: {codigo} ({} bytes)", codigo.len());
    println!("\n✔ Tres datos por dirección. Esta tiene saldo, no envió nada y no tiene código.");
    Ok(())
}
