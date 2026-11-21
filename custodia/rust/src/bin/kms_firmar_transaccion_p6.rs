// Paso 6 · La misma firma sin cada una de las dos correcciones: qué responde la cadena.
use alloy::consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy::eips::eip2718::Encodable2718;
use alloy::primitives::utils::{format_ether, parse_ether};
use alloy::primitives::{address, Address, Signature, TxKind, B256, U256};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};
use serde_json::{json, Value};

const KMS: &str = "http://localhost:4566";
const NODO: &str = "http://127.0.0.1:8545";
const ALIAS: &str = "alias/ruta-kms-firmar-transaccion";

fn si_no(valor: bool) -> &'static str {
    if valor { "sí" } else { "no" }
}
fn numero(hex: &Value) -> U256 {
    U256::from_str_radix(hex.as_str().unwrap_or("0x0").trim_start_matches("0x"), 16).unwrap_or_default()
}

// Las preguntas van a mano para ver la respuesta del nodo tal cual, sin el texto que añade la librería.
async fn preguntar(method: &str, params: Value) -> Value {
    let peticion = json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": params });
    let Ok(respuesta) = reqwest::Client::new().post(NODO).json(&peticion).send().await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    respuesta.json().await.unwrap_or_default()
}

async fn pedir_a_kms(hash: B256) -> eyre::Result<(Address, U256, U256)> {
    // Credenciales ficticias escritas a mano: el cliente no lee ninguna credencial real de tu máquina.
    let credenciales = Credentials::new("test", "test", None, None, "lab");
    let config = aws_sdk_kms::Config::builder().behavior_version(BehaviorVersion::latest()).endpoint_url(KMS).region(Region::new("us-east-1")).credentials_provider(credenciales).build();
    let kms = aws_sdk_kms::Client::from_conf(config);
    let publica = kms.get_public_key().key_id(ALIAS).send().await?.public_key.unwrap().into_inner();
    let direccion = Address::from_raw_public_key(&publica[publica.len() - 64..]);
    let respuesta = kms.sign().key_id(ALIAS).message(Blob::new(hash.as_slice())).message_type(MessageType::Digest).signing_algorithm(SigningAlgorithmSpec::EcdsaSha256).send().await?;
    let firma = k256::ecdsa::Signature::from_der(respuesta.signature().unwrap().as_ref())?;
    Ok((direccion, U256::from_be_slice(&firma.r().to_bytes()), U256::from_be_slice(&firma.s().to_bytes())))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let n = U256::from_str_radix("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)?;
    let mitad = n / U256::from(2);

    // La siguiente transferencia de la misma cuenta: la del paso 5 con nonce 1.
    let destino = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");
    let transaccion = TxEip1559 { chain_id: 31337, nonce: 1, max_priority_fee_per_gas: 1_000_000_000, max_fee_per_gas: 2_000_000_000, gas_limit: 21000, to: TxKind::Call(destino), value: parse_ether("0.25")?, ..Default::default() };
    let hash = transaccion.signature_hash();
    let serializar = |firma: Signature| format!("0x{}", hex::encode(TxEnvelope::from(transaccion.clone().into_signed(firma)).encoded_2718()));

    // La firma de KMS, corregida como en el paso 5: r, s baja y su yParity.
    let Ok((direccion, r, mut s)) = pedir_a_kms(hash).await else {
        eprintln!("✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.");
        std::process::exit(1);
    };
    if s > mitad {
        s = n - s;
    }
    let y_parity = Signature::new(r, s, false).recover_address_from_prehash(&hash)? != direccion;

    // Error A · yParity equivocado: la firma se lee como si fuera de otra llave.
    let otra_paridad = Signature::new(r, s, !y_parity);
    let otra = otra_paridad.recover_address_from_prehash(&hash)?;
    let saldo_otra = format_ether(numero(&preguntar("eth_getBalance", json!([otra, "latest"])).await["result"]));
    let rechazo = preguntar("eth_sendRawTransaction", json!([serializar(otra_paridad)])).await["error"].clone();
    println!("Con el yParity contrario:");
    println!("≈ Dirección que se recupera: {otra}");
    println!("  Es la dirección de la llave: {}", si_no(otra == direccion));
    println!("  Saldo de esa dirección: {} ETH", saldo_otra.trim_end_matches('0').trim_end_matches('.'));
    println!("  Respuesta del nodo: error {} · {}", rechazo["code"], rechazo["message"].as_str().unwrap_or_default());

    // Error B · s sin bajar: (r, N − s) con el yParity contrario es la misma firma en su forma alta.
    let s_alta = Signature::new(r, n - s, !y_parity);
    let recuperada = s_alta.recover_address_from_prehash(&hash)?;
    let envio = preguntar("eth_sendRawTransaction", json!([serializar(s_alta)])).await;
    println!("\nCon s en la mitad alta:");
    println!("≈ Dirección que se recupera: {recuperada}");
    println!("  Es la dirección de la llave: {}", si_no(recuperada == direccion));
    println!("  s mayor que la mitad del orden: {} (EIP-2: firma inválida)", si_no(n - s > mitad));
    match envio.get("error") {
        Some(error) => println!("  Respuesta del nodo: error {} · {}", error["code"], error["message"].as_str().unwrap_or_default()),
        None => {
            println!("  Respuesta del nodo: aceptada");
            // Anvil la mina enseguida. Cuando ya está en un bloque se lee de vuelta, con la firma que quedó escrita.
            let minada = loop {
                let minada = preguntar("eth_getTransactionByHash", json!([envio["result"]])).await["result"].clone();
                if !minada["blockNumber"].is_null() {
                    break minada;
                }
            };
            println!("≈ Hash de la transacción: {}", envio["result"].as_str().unwrap_or_default());
            println!("  Bloque: {}", numero(&minada["blockNumber"]));
            println!("  s dentro de la transacción minada, mayor que la mitad del orden: {}", si_no(numero(&minada["s"]) > mitad));
        }
    }

    let nonce = numero(&preguntar("eth_getTransactionCount", json!([direccion, "latest"])).await["result"]);
    println!("\nNonce de la dirección de KMS: {nonce}");
    println!("\n✔ El yParity equivocado se nota enseguida. La s alta no: esta cadena local la dejó pasar, así que la comprobación va en tu código.");
    Ok(())
}
