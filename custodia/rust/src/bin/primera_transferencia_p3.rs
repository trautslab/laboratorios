// Paso 3 · Enviar 1 ETH: la librería arma el mensaje, lo firma con la llave y lo entrega al nodo.
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, utils::parse_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

// Llave PÚBLICA de la cuenta de prueba 0: Anvil la imprime al arrancar. Nunca la uses en una red real.
const LLAVE: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DESTINO: Address = address!("40596E1B9B0032595240d85AC2Cf9e6b83041399"); // una dirección que nadie usó en esta cadena

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cuenta: PrivateKeySigner = LLAVE.parse()?;
    let origen = cuenta.address();
    let billetera = ProviderBuilder::new().wallet(cuenta).connect_http("http://127.0.0.1:8545".parse()?);

    let transferencia = TransactionRequest::default()
        .with_to(DESTINO)
        .with_value(parse_ether("1")?)
        // Tope de comisión, fijado a mano para que el hash salga igual en Node, en Rust y en tu máquina.
        // Sin estas dos líneas la librería elige el tope por ti. Qué significan: laboratorio «Gas y comisión».
        .with_max_fee_per_gas(2_000_000_000)
        .with_max_priority_fee_per_gas(1_000_000_000);
    // Por dentro: firma en tu máquina y eth_sendRawTransaction.
    let Ok(pendiente) = billetera.send_transaction(transferencia).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("De:    {origen}");
    println!("Para:  {DESTINO}");
    println!("Valor: 1 ETH");
    println!("\nHash:  {}", pendiente.tx_hash());
    println!("\n✔ El nodo aceptó el mensaje firmado y devolvió su hash. Guárdalo: con él se pide el recibo.");
    Ok(())
}
