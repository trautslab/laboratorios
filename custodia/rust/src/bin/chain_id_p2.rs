// Paso 2 · Firmar una transferencia sin enviarla y leer el chain id que quedó dentro.
use alloy::consensus::{SignableTransaction, Transaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::{Decodable2718, Encodable2718};
use alloy::network::TxSignerSync;
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::{address, TxKind};
use alloy::signers::local::PrivateKeySigner;

fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let cuenta: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;

    // La transferencia completa: 1 ETH a la cuenta de prueba 1. El primer campo dice para qué red es.
    let mut transferencia = TxEip1559 {
        chain_id: 31337,
        nonce: 0,
        to: TxKind::Call(address!("70997970C51812dc3A010C7d01b50e0d17dc79C8")),
        value: parse_ether("1")?,
        gas_limit: 21000,
        max_fee_per_gas: 2_000_000_000,
        max_priority_fee_per_gas: 1_000_000_000,
        ..Default::default()
    };

    // Firmar es un cálculo local: aquí no se habla con ninguna red y no se envía nada.
    let firma = cuenta.sign_transaction_sync(&mut transferencia)?;
    let firmada = TxEnvelope::from(transferencia.into_signed(firma)).encoded_2718();
    println!("Firmada para el chain id 31337 ({} bytes):", firmada.len());
    println!("0x{}", hex::encode(&firmada));

    // Cualquiera que reciba esos bytes puede leer los campos, también el chain id.
    let leida = TxEnvelope::decode_2718(&mut firmada.as_slice())?;
    let valor = format_ether(leida.value());
    println!("\nLeída de vuelta desde esos bytes:");
    println!("  chain id: {}", leida.chain_id().unwrap_or_default());
    println!("  nonce:    {}", leida.nonce());
    println!("  para:     {}", leida.to().unwrap_or_default());
    println!("  valor:    {} ETH", valor.trim_end_matches('0').trim_end_matches('.'));
    println!("\n✔ El chain id es un campo de lo que se firmó. Este script no habló con ninguna red.");
    Ok(())
}
