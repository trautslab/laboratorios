// Paso 3 · Firmar una vez y enviar dos: la cadena acepta el primer envío y rechaza la repetición.
use alloy::consensus::TxEnvelope;
use alloy::eips::Encodable2718;
use alloy::network::{EthereumWallet, NetworkTransactionBuilder, TransactionBuilder};
use alloy::primitives::{address, utils::format_ether, utils::parse_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

const NODO: &str = "http://127.0.0.1:8545";
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DESTINO: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // cuenta de prueba 1

// Firmar no toca la red: devuelve bytes. El nonce lo eliges tú; la comisión va fija y sobra para Anvil.
async fn firmar(billetera: &EthereumWallet, nonce: u64, eth: &str) -> eyre::Result<TxEnvelope> {
    let pedido = TransactionRequest::default()
        .with_chain_id(31337)
        .with_nonce(nonce)
        .with_to(DESTINO)
        .with_value(parse_ether(eth)?)
        .with_gas_limit(21_000)
        .with_max_fee_per_gas(2_000_000_000)
        .with_max_priority_fee_per_gas(1_000_000_000);
    Ok(pedido.build(billetera).await?)
}

// Envía bytes ya firmados. Si el nodo los rechaza, devuelve su error tal cual: código y mensaje.
async fn enviar(cadena: &impl Provider, bytes: &[u8]) -> eyre::Result<String> {
    let pendiente = match cadena.send_raw_transaction(bytes).await {
        Ok(pendiente) => pendiente, // por dentro: eth_sendRawTransaction
        Err(error) => match error.as_error_resp() {
            Some(del_nodo) => return Ok(format!("rechazada · error {} «{}»", del_nodo.code, del_nodo.message)),
            None => return Err(error.into()),
        },
    };
    pendiente.get_receipt().await?;
    Ok("aceptada".to_string())
}

async fn estado(cadena: &impl Provider, cuenta: Address) -> eyre::Result<String> {
    let nonce = cadena.get_transaction_count(cuenta).await?;
    let saldo = format_ether(cadena.get_balance(DESTINO).await?);
    Ok(format!("nonce de la cuenta {nonce} · saldo del destino {} ETH", saldo.trim_end_matches('0').trim_end_matches('.')))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let firmante: PrivateKeySigner = LLAVE.parse()?;
    let cuenta = firmante.address();
    let billetera = EthereumWallet::from(firmante);
    let cadena = ProviderBuilder::new().connect_http(NODO.parse()?);

    let Ok(nonce) = cadena.get_transaction_count(cuenta).await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("Antes: {}", estado(&cadena, cuenta).await?);

    let firmada = firmar(&billetera, nonce, "1").await?;
    let bytes = firmada.encoded_2718();
    println!("\nFirmo una sola vez: 1 ETH al destino, con el nonce {nonce}.");
    println!("Son {} bytes. Su hash: {}", bytes.len(), firmada.tx_hash());

    println!("\nPrimer envío:                 {}", enviar(&cadena, &bytes).await?);
    println!("  {}", estado(&cadena, cuenta).await?);
    println!("Segundo envío, mismos bytes:  {}", enviar(&cadena, &bytes).await?);
    println!("  {}", estado(&cadena, cuenta).await?);

    // Una transacción distinta (otro monto, otra firma) que reutiliza el número ya gastado.
    let otra = firmar(&billetera, nonce, "5").await?.encoded_2718();
    println!("Otra distinta, mismo nonce {nonce}: {}", enviar(&cadena, &otra).await?);
    println!("  {}", estado(&cadena, cuenta).await?);
    println!("\n✔ Cada nonce se usa una sola vez: la cadena rechazó la repetición y otra transacción con ese número.");
    Ok(())
}
