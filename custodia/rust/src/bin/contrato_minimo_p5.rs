// Paso 5 · Escribir: una transacción con destino el contrato y los datos de la llamada.
use alloy::primitives::{address, Address, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::sol;

sol!(#[sol(rpc)] Contador, "../contrato-minimo/contratos/out/Contador.json");

const QUIEN: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");
const CONTADOR: Address = address!("8464135c8F25Da09e49BC8782676a84730C318bC");

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);
    let casilla0 = || async { cadena.get_storage_at(CONTADOR, U256::ZERO).await }; // eth_getStorageAt
    let Ok(antes) = casilla0().await else {
        eprintln!("✖ No hay contrato en esa dirección. Corre antes el paso 3 sobre una cadena nueva.");
        std::process::exit(1);
    };
    println!("Casilla 0 antes:   0x{}", hex::encode(antes.to_be_bytes::<32>()));

    let contador = Contador::new(CONTADOR, &cadena);
    let envio = contador.sumar(U256::from(5)).from(QUIEN).gas(100_000).max_fee_per_gas(2_000_000_000).max_priority_fee_per_gas(1_000_000_000);
    let pendiente = envio.send().await?;
    let hash = *pendiente.tx_hash();
    let tx = cadena.get_transaction_by_hash(hash).await?.expect("la transacción existe");
    let datos = hex::encode(alloy::consensus::Transaction::input(&tx));
    println!("Datos enviados:    0x{} + {}", &datos[..8], &datos[8..]);
    println!("                   selector de sumar(uint256) + el 5 en 32 bytes");

    let recibo = pendiente.get_receipt().await?;
    println!("Recibo: status {} · bloque {} · gas usado {}", u8::from(recibo.status()), recibo.block_number.unwrap_or(0), recibo.gas_used);
    println!("Casilla 0 después: 0x{}", hex::encode(casilla0().await?.to_be_bytes::<32>()));
    println!("valor() ahora:     {}", contador.valor().call().await?);
    println!("\n✔ Escribir cambia el estado del contrato: hace falta una transacción, un bloque y una comisión.");
    Ok(())
}
