// Paso 2 · Armar la transacción sin firmar y calcular el hash que se va a firmar.
use alloy::consensus::{SignableTransaction, TxEip1559};
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::{address, TxKind};

fn main() -> eyre::Result<()> {
    // Todos los campos, escritos a mano. No hay campo «de»: quién envía sale de la firma.
    let destino = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");
    let transaccion = TxEip1559 {
        chain_id: 31337,
        nonce: 0,
        max_priority_fee_per_gas: 1_000_000_000,
        max_fee_per_gas: 2_000_000_000,
        gas_limit: 21000,
        to: TxKind::Call(destino),
        value: parse_ether("0.25")?,
        ..Default::default()
    };

    // Sin firma, la serialización es el byte de tipo 02 seguido de la lista de campos.
    let sin_firma = transaccion.encoded_for_signing();
    // Lo que se firma es el keccak256 de esos bytes: siempre 32 bytes.
    let hash = transaccion.signature_hash();

    let valor = format_ether(transaccion.value);
    println!("Transacción sin firmar (tipo 2):");
    println!("  chain id:         {}", transaccion.chain_id);
    println!("  nonce:            {}", transaccion.nonce);
    println!("  propina máxima:   {} gwei por gas", transaccion.max_priority_fee_per_gas / 1_000_000_000);
    println!("  comisión máxima:  {} gwei por gas", transaccion.max_fee_per_gas / 1_000_000_000);
    println!("  gas:              {}", transaccion.gas_limit);
    println!("  para:             {destino}");
    println!("  valor:            {} ETH", valor.trim_end_matches('0').trim_end_matches('.'));
    println!("\nSerializada sin firma ({} bytes):", sin_firma.len());
    println!("0x{}", hex::encode(&sin_firma));
    println!("\nHash a firmar ({} bytes):", hash.len());
    println!("{hash}");
    println!("\n✔ Esos 32 bytes son lo único que va a recibir KMS. Este script no habló con KMS ni con la cadena.");
    Ok(())
}
