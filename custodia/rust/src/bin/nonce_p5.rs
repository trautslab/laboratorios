// Paso 5 · Enviar el número que faltaba: las dos transacciones entran, en el orden de sus nonces.
use alloy::consensus::{Transaction as _, TxEnvelope};
use alloy::eips::Encodable2718;
use alloy::network::{EthereumWallet, NetworkTransactionBuilder, TransactionBuilder, TransactionResponse};
use alloy::primitives::{address, utils::parse_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;
use serde_json::Value;

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

fn a_decimal(hex: &Value) -> u64 {
    u64::from_str_radix(hex.as_str().unwrap_or_default().trim_start_matches("0x"), 16).unwrap_or_default()
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
    println!("Nonce de la cuenta: {nonce}");
    println!("Firmo con el nonce {nonce}: el que faltaba.");

    let bytes = firmar(&billetera, nonce, "1").await?.encoded_2718();
    let pendiente = cadena.send_raw_transaction(&bytes).await?;
    println!("Envío: aceptado · hash {}", pendiente.tx_hash());
    let recibo = pendiente.get_receipt().await?;

    // El bloque donde entró, con sus transacciones completas y en el orden en que se ejecutaron.
    let numero = recibo.block_number.unwrap_or_default();
    let bloque = cadena.get_block_by_number(numero.into()).full().await?.expect("el bloque existe");
    println!("\nBloque {numero}, en orden de ejecución:");
    for tx in bloque.transactions.txns() {
        println!("  posición {} · nonce {} · hash {}", tx.transaction_index.unwrap_or_default(), tx.nonce(), tx.tx_hash());
    }

    println!("\nNonce de la cuenta: {}", cadena.get_transaction_count(cuenta).await?);
    let pool: Value = cadena.raw_request("txpool_status".into(), ()).await?;
    println!("Pool del nodo:      {} listas para el próximo bloque · {} en espera", a_decimal(&pool["pending"]), a_decimal(&pool["queued"]));
    println!("\n✔ Al llegar el nonce {nonce}, entraron {} transacciones en el mismo bloque: primero la de nonce menor.", bloque.transactions.len());
    Ok(())
}
