// Paso 6 · `latest` y `pending`: qué cuenta cada uno cuando hay transacciones esperando un bloque.
use alloy::consensus::{Transaction as _, TxEnvelope};
use alloy::eips::{BlockNumberOrTag, Encodable2718};
use alloy::network::{EthereumWallet, NetworkTransactionBuilder, TransactionBuilder};
use alloy::primitives::{address, utils::parse_ether, Address};
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

// El mismo método, eth_getTransactionCount, con dos etiquetas de bloque distintas.
async fn contadores(cadena: &impl Provider, cuenta: Address) -> eyre::Result<String> {
    let latest = cadena.get_transaction_count(cuenta).latest().await?;
    let pending = cadena.get_transaction_count(cuenta).pending().await?;
    Ok(format!("latest {latest} · pending {pending}"))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let firmante: PrivateKeySigner = LLAVE.parse()?;
    let cuenta = firmante.address();
    let billetera = EthereumWallet::from(firmante);
    let cadena = ProviderBuilder::new().connect_http(NODO.parse()?);

    // Anvil produce un bloque por transacción. Lo pausas para que esperen, como en una red real.
    if cadena.raw_request::<_, ()>("evm_setAutomine".into(), (false,)).await.is_err() {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }
    println!("Bloques automáticos: en pausa");
    println!("  {}", contadores(&cadena, cuenta).await?);

    for _ in [1, 2] {
        let nonce = cadena.get_transaction_count(cuenta).pending().await?; // el siguiente número libre, contando lo que espera
        let bytes = firmar(&billetera, nonce, "1").await?.encoded_2718();
        let _ = cadena.send_raw_transaction(&bytes).await?; // sin esperar recibo: todavía no hay bloque
        println!("Envío con el nonce {nonce}: aceptado, espera un bloque");
        println!("  {}", contadores(&cadena, cuenta).await?);
    }

    cadena.raw_request::<_, ()>("anvil_mine".into(), ("0x1",)).await?;
    let bloque = cadena.get_block_by_number(BlockNumberOrTag::Latest).full().await?.expect("el bloque existe");
    let nonces: Vec<String> = bloque.transactions.txns().map(|tx| tx.nonce().to_string()).collect();
    println!("Pido un bloque: el {}, con los nonces {}, en ese orden", bloque.header.number, nonces.join(" y "));
    println!("  {}", contadores(&cadena, cuenta).await?);

    cadena.raw_request::<_, ()>("evm_setAutomine".into(), (true,)).await?;
    println!("Bloques automáticos: activos otra vez");
    println!("\n✔ `latest` cuenta lo incluido en bloques; `pending` suma lo que espera en orden. El siguiente nonce sale de `pending`.");
    Ok(())
}
