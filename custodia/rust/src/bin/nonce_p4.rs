// Paso 4 · Saltarse un número: el nodo guarda la transacción, pero no la incluye en ningún bloque.
use alloy::consensus::TxEnvelope;
use alloy::eips::Encodable2718;
use alloy::network::{EthereumWallet, NetworkTransactionBuilder, TransactionBuilder};
use alloy::primitives::{address, utils::parse_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;
use serde_json::Value;
use std::time::Duration;

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
    println!("Firmo con el nonce {}: me salto el {nonce}.", nonce + 1);

    let bytes = firmar(&billetera, nonce + 1, "1").await?.encoded_2718();
    let hash = match cadena.send_raw_transaction(&bytes).await {
        Ok(pendiente) => *pendiente.tx_hash(),
        Err(error) => {
            let del_nodo = error.as_error_resp().ok_or_else(|| eyre::eyre!("{error}"))?;
            println!("Envío: rechazado · error {} «{}»", del_nodo.code, del_nodo.message);
            std::process::exit(1);
        }
    };
    println!("Envío: aceptado · hash {hash}");

    tokio::time::sleep(Duration::from_secs(1)).await;
    println!("\nUn segundo después:");
    let recibo = match cadena.get_transaction_receipt(hash).await? {
        Some(recibo) => format!("en el bloque {}", recibo.block_number.unwrap_or_default()),
        None => "no hay".to_string(),
    };
    println!("  Recibo:          {recibo}");
    println!("  Bloque actual:   {}", cadena.get_block_number().await?);
    println!("  Nonce (latest):  {}", cadena.get_transaction_count(cuenta).latest().await?);
    println!("  Nonce (pending): {}", cadena.get_transaction_count(cuenta).pending().await?);
    // txpool_status no es parte del estándar: Anvil lo ofrece para ver qué guarda el nodo sin incluir.
    let pool: Value = cadena.raw_request("txpool_status".into(), ()).await?;
    println!("  Pool del nodo:   {} listas para el próximo bloque · {} en espera", a_decimal(&pool["pending"]), a_decimal(&pool["queued"]));
    println!("\n✔ El nodo aceptó el nonce {} y lo dejó en espera: no puede incluirlo hasta que llegue el {nonce}.", nonce + 1);
    Ok(())
}
