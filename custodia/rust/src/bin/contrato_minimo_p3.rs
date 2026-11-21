// Paso 3 · Desplegar: una transacción sin destino que lleva el código de creación.
use alloy::primitives::{address, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::sol;

sol!(#[sol(rpc)] Contador, "../contrato-minimo/contratos/out/Contador.json");

const QUIEN: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // la cuenta de prueba 1 de Anvil

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    // La dirección se puede saber antes de enviar: sale de quien despliega y de su nonce.
    let Ok(nonce) = cadena.get_transaction_count(QUIEN).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    let prevista = QUIEN.create(nonce);
    println!("Quien despliega: {QUIEN} (nonce {nonce})");
    println!("Dirección prevista: {prevista}\n");

    let envio = Contador::deploy_builder(&cadena).from(QUIEN).gas(200_000).max_fee_per_gas(2_000_000_000).max_priority_fee_per_gas(1_000_000_000);
    let pendiente = envio.send().await?;
    let hash = *pendiente.tx_hash();
    let recibo = pendiente.get_receipt().await?;
    let tx = cadena.get_transaction_by_hash(hash).await?.expect("la transacción existe");
    let to = alloy::consensus::Transaction::to(&tx);
    let datos = alloy::consensus::Transaction::input(&tx).len();
    println!("Transacción: to = {} · datos = {datos} bytes", to.map(|a| a.to_string()).unwrap_or("null".into()));
    let direccion = recibo.contract_address.expect("el recibo trae la dirección");
    println!("Recibo: status {} · bloque {} · gas usado {}", u8::from(recibo.status()), recibo.block_number.unwrap_or(0), recibo.gas_used);
    println!("Dirección del recibo: {direccion}");
    println!("¿Coincide con la prevista? {}", if direccion == prevista { "sí" } else { "no" });
    println!("Código guardado: {} bytes", cadena.get_code_at(prevista).await?.len());
    println!("\n✔ El contrato existe: una dirección nueva con código, creada por una transacción.");
    Ok(())
}
