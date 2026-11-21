// Paso 4 · Un contrato es una cuenta con código: la cadena le guarda los mismos tres datos.
use alloy::primitives::{address, utils::{format_ether, parse_ether}, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::sol;

// El contrato ya compilado (lib/compilar.mjs): una alcancía que recibe ETH al crearse.
sol!(#[sol(rpc)] Alcancia, "../cuentas-y-contratos/contratos/out/Alcancia.json");

const CREADOR: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // la cuenta de prueba 1 de Anvil

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);

    let Ok(antes) = cadena.get_transaction_count(CREADOR).await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("Antes:   la cuenta de prueba 1 tiene nonce {antes}");

    // Poner el contrato en la cadena (código ya hecho: el despliegue se explica en el laboratorio
    // de contratos). La cuenta de prueba 1 envía una transacción con el código y 1 ETH; Anvil la firma.
    let creacion = Alcancia::deploy_builder(&cadena).from(CREADOR).value(parse_ether("1")?);
    let recibo = creacion.send().await?.get_receipt().await?;
    let direccion = recibo.contract_address.expect("el recibo trae la dirección del contrato");
    println!("Contrato creado en {direccion}");
    println!("Después: la cuenta de prueba 1 tiene nonce {}\n", cadena.get_transaction_count(CREADOR).await?);

    // Las mismas tres preguntas del paso 2, ahora sobre la dirección del contrato.
    let saldo = cadena.get_balance(direccion).await?; // por dentro: eth_getBalance
    let nonce = cadena.get_transaction_count(direccion).await?; // por dentro: eth_getTransactionCount
    let codigo = cadena.get_code_at(direccion).await?; // por dentro: eth_getCode
    let eth = format_ether(saldo);
    println!("Saldo:  {saldo} wei = {} ETH", eth.trim_end_matches('0').trim_end_matches('.'));
    println!("Nonce:  {nonce}");
    println!("Código: {}… ({} bytes)", &codigo.to_string()[..22], codigo.len());
    println!("\n✔ Un contrato tiene saldo y nonce como cualquier cuenta. Lo que lo distingue es el código.");
    Ok(())
}
