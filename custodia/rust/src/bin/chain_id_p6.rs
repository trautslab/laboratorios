// Paso 6 · Antes de firmar: el chain id sale de tu configuración y se compara con el del nodo.
use alloy::consensus::{SignableTransaction, Transaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::{Decodable2718, Encodable2718};
use alloy::network::TxSignerSync;
use alloy::primitives::{address, utils::parse_ether, TxKind};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::PrivateKeySigner;

// La lista de redes de quien firma: nombre, URL del nodo y el chain id que se espera ahí.
// Las dos apuntan al mismo puerto a propósito: así una de las dos URL lleva a la red equivocada.
const REDES: [(&str, &str, u64); 2] = [
    ("red-a", "http://127.0.0.1:8545", 31337),
    ("red-b", "http://127.0.0.1:8545", 1337),
];

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let cuenta: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;

    for (nombre, url, chain_id) in REDES {
        let nodo = ProviderBuilder::new().connect_http(url.parse()?);
        let Ok(chain_id_del_nodo) = nodo.get_chain_id().await else {
            eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil --chain-id 1337");
            std::process::exit(1);
        };
        println!("Red configurada: {nombre}, chain id {chain_id}");
        println!("  El nodo de su URL responde: chain id {chain_id_del_nodo}");
        if chain_id_del_nodo != chain_id {
            println!("  No coinciden: no se firma.\n");
            continue;
        }
        // El chain id que se firma es el de la configuración, nunca el que acaba de decir el nodo.
        let nonce = nodo.get_transaction_count(cuenta.address()).await?;
        let mut transferencia = TxEip1559 {
            chain_id,
            nonce,
            to: TxKind::Call(address!("70997970C51812dc3A010C7d01b50e0d17dc79C8")),
            value: parse_ether("1")?,
            gas_limit: 21000,
            max_fee_per_gas: 2_000_000_000,
            max_priority_fee_per_gas: 1_000_000_000,
            ..Default::default()
        };
        let firma = cuenta.sign_transaction_sync(&mut transferencia)?;
        let firmada = TxEnvelope::from(transferencia.into_signed(firma)).encoded_2718();
        let leida = TxEnvelope::decode_2718(&mut firmada.as_slice())?;
        println!("  Coinciden: se firma.");
        println!("  Dentro de lo firmado: chain id {}, nonce {nonce}\n", leida.chain_id().unwrap_or_default());
    }
    println!("✔ La comprobación detuvo la firma para la red cuya URL llevaba a otra cadena.");
    Ok(())
}
