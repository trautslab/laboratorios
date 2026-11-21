// Paso 3 · Rechazo antes del bloque: el nodo entiende la transacción y no la admite.
use alloy::network::TransactionBuilder;
use alloy::primitives::{address, utils::format_ether, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;

// Llave PÚBLICA de la cuenta de prueba 1: Anvil la imprime al arrancar. Nunca la uses en una red real.
const LLAVE: &str = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const DESTINO: Address = address!("3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"); // cuenta de prueba 2

fn en_eth(wei: U256) -> String {
    format_ether(wei).trim_end_matches('0').trim_end_matches('.').to_string()
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cuenta: PrivateKeySigner = LLAVE.parse()?;
    let origen = cuenta.address();
    let billetera = ProviderBuilder::new().wallet(cuenta).connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(saldo) = billetera.get_balance(origen).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    let (nonce, bloque) = (billetera.get_transaction_count(origen).await?, billetera.get_block_number().await?);
    println!("Antes:   saldo {} ETH · nonce {nonce}", en_eth(saldo));
    println!("Intento: enviar {} ETH, todo el saldo. La comisión ya no cabe.", en_eth(saldo));

    // Por dentro: firma en tu máquina y eth_sendRawTransaction. A ese envío responde el nodo.
    let transferencia = TransactionRequest::default().with_to(DESTINO).with_value(saldo);
    match billetera.send_transaction(transferencia).await {
        Ok(pendiente) => println!("Hash:    {}", pendiente.tx_hash()),
        Err(error) => {
            // El error de alloy puede venir de varias capas. as_error_resp() da el objeto que envió el nodo.
            let del_nodo = error.as_error_resp().ok_or_else(|| eyre::eyre!("el nodo dejó de responder"))?;
            println!("El nodo respondió con un error:\n  code:    {}\n  message: {}", del_nodo.code, del_nodo.message);
            println!("Hash:    ninguno");
        }
    }
    let (saldo, nonce) = (billetera.get_balance(origen).await?, billetera.get_transaction_count(origen).await?);
    let nuevos = billetera.get_block_number().await? - bloque;
    println!("Después: saldo {} ETH · nonce {nonce} · bloques nuevos {nuevos}", en_eth(saldo));
    println!("\n✔ Rechazo antes del bloque: sin hash, sin recibo y sin costo. En la cadena no pasó nada.");
    Ok(())
}
