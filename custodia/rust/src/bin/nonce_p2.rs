// Paso 2 · El nonce es un contador por cuenta: léelo, envía una transferencia y vuelve a leerlo.
use alloy::consensus::Transaction as _;
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, utils::parse_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

const NODO: &str = "http://127.0.0.1:8545";
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DESTINO: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // cuenta de prueba 1

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let firmante: PrivateKeySigner = LLAVE.parse()?;
    let cuenta = firmante.address();
    let cadena = ProviderBuilder::new().wallet(firmante).connect_http(NODO.parse()?);

    println!("Cuenta que envía: {cuenta}");
    let Ok(antes) = cadena.get_transaction_count(cuenta).await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }; // por dentro: eth_getTransactionCount
    println!("Nonce antes de enviar:          {antes}");

    // No le pasas el nonce: la librería se lo pregunta a la cadena y lo pone en la transacción antes de firmar.
    let pedido = TransactionRequest::default().with_to(DESTINO).with_value(parse_ether("1")?);
    let recibo = cadena.send_transaction(pedido).await?.get_receipt().await?;
    let enviada = cadena.get_transaction_by_hash(recibo.transaction_hash).await?.expect("la transacción existe");
    println!("Nonce que llevó la transacción: {}", enviada.nonce());
    println!("Incluida en el bloque:          {}", recibo.block_number.unwrap_or_default());

    let despues = cadena.get_transaction_count(cuenta).await?;
    println!("Nonce después de enviar:        {despues}");
    println!("Nonce de la cuenta que recibió: {}", cadena.get_transaction_count(DESTINO).await?);
    println!("\n✔ El nonce cuenta lo que una cuenta envía: pasó de {antes} a {despues}. Recibir no lo mueve.");
    Ok(())
}
