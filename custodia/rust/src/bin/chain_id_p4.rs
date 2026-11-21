// Paso 4 · Enviar a la red 1337 los bytes firmados para la red 31337.
use alloy::consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::Encodable2718;
use alloy::network::TxSignerSync;
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::{address, Address, TxKind};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::PrivateKeySigner;
use serde_json::{json, Value};

const NODO: &str = "http://127.0.0.1:8545";
const DESTINO: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");

// La pregunta va a mano para ver la respuesta del nodo tal cual, sin el texto que añade la librería.
async fn preguntar(method: &str, params: Value) -> eyre::Result<Value> {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": params });
    Ok(reqwest::Client::new().post(NODO).json(&peticion).send().await?.json().await?)
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let cuenta: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let red = ProviderBuilder::new().connect_http(NODO.parse()?);

    let Ok(chain_id) = red.get_chain_id().await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil --chain-id 1337");
        std::process::exit(1);
    };
    if chain_id == 31337 {
        eprintln!("✖ Este nodo es la red 31337, la misma de la firma. Cierra Anvil y corre: npx anvil --chain-id 1337");
        std::process::exit(1);
    }
    // Los mismos campos del paso 2: la firma sale idéntica, byte por byte.
    let mut transferencia = TxEip1559 {
        chain_id: 31337,
        nonce: 0,
        to: TxKind::Call(DESTINO),
        value: parse_ether("1")?,
        gas_limit: 21000,
        max_fee_per_gas: 2_000_000_000,
        max_priority_fee_per_gas: 1_000_000_000,
        ..Default::default()
    };
    let firma = cuenta.sign_transaction_sync(&mut transferencia)?;
    let firmada = format!("0x{}", hex::encode(TxEnvelope::from(transferencia.into_signed(firma)).encoded_2718()));
    println!("Firmada para el chain id 31337:");
    println!("{firmada}");
    println!("\nEl nodo es la red:  chain id {chain_id}");

    let respuesta = preguntar("eth_sendRawTransaction", json!([firmada])).await?;
    println!("Petición:           eth_sendRawTransaction con esos bytes");
    match respuesta.get("error") {
        Some(error) => println!("Respuesta del nodo: error {} · {}", error["code"], error["message"].as_str().unwrap_or_default()),
        None => println!("Respuesta del nodo: {}", respuesta["result"].as_str().unwrap_or_default()),
    }

    let saldo = format_ether(red.get_balance(DESTINO).await?);
    println!("\nDespués del intento:");
    println!("  Bloque:                 {}", red.get_block_number().await?);
    println!("  Nonce de quien firmó:   {}", red.get_transaction_count(cuenta.address()).await?);
    println!("  Saldo del destinatario: {} ETH", saldo.trim_end_matches('0').trim_end_matches('.'));
    println!("\n✔ La red {chain_id} rechazó una firma hecha para la red 31337. No se movió nada.");
    Ok(())
}
