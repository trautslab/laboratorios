// Paso 4 · Las dos correcciones: s en la mitad baja y el yParity que KMS no devuelve.
use alloy::consensus::{SignableTransaction, TxEip1559};
use alloy::primitives::utils::parse_ether;
use alloy::primitives::{address, Address, Signature, TxKind, B256, U256};
use aws_sdk_kms::config::{BehaviorVersion, Credentials, Region};
use aws_sdk_kms::primitives::Blob;
use aws_sdk_kms::types::{MessageType, SigningAlgorithmSpec};

const KMS: &str = "http://localhost:4566";
const ALIAS: &str = "alias/ruta-kms-firmar-transaccion";

// La dirección de la llave (paso 1) y una firma nueva de KMS, leída del DER con la librería.
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
    // N es el orden de la curva secp256k1: cuántos valores distintos puede tomar s.
    let n = U256::from_str_radix("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)?;
    let mitad = n / U256::from(2);

    // La transacción del paso 2 y su hash.
    let destino = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8");
    let transaccion = TxEip1559 { chain_id: 31337, nonce: 0, max_priority_fee_per_gas: 1_000_000_000, max_fee_per_gas: 2_000_000_000, gas_limit: 21000, to: TxKind::Call(destino), value: parse_ether("0.25")?, ..Default::default() };
    let hash = transaccion.signature_hash();

    let Ok((direccion, r, s_de_kms)) = pedir_a_kms(hash).await else {
        eprintln!("✖ KMS no firmó. Arranca el emulador y corre antes el paso 1.");
        std::process::exit(1);
    };

    // Corrección 1 · (r, s) y (r, N − s) valen para el mismo hash. La cadena solo acepta la de s baja.
    let venia = if s_de_kms > mitad { "alta" } else { "baja" };
    let s = if s_de_kms > mitad { n - s_de_kms } else { s_de_kms };
    println!("Mitad del orden de la curva: 0x{mitad:064x}");
    println!("≈ s que devolvió KMS: 0x{s_de_kms:064x}");
    println!("≈ Venía en la mitad: {venia}");
    println!("≈ s que se usa: 0x{s:064x}");
    println!("s queda en la mitad baja: {}", if s <= mitad { "sí" } else { "no" });

    // Corrección 2 · KMS no devuelve yParity. Se prueba 0 y 1, y vale el que recupera la dirección de la llave.
    println!("\nDirección que se recupera del hash y la firma:");
    let mut y_parity = None;
    for candidato in [0u8, 1] {
        let recuperada = Signature::new(r, s, candidato == 1).recover_address_from_prehash(&hash)?;
        println!("≈ Con yParity {candidato}: {recuperada}");
        if recuperada == direccion {
            y_parity = Some(candidato);
        }
    }
    println!("≈ Dirección de la llave: {direccion}");
    println!("≈ yParity de esta firma: {}", y_parity.unwrap_or_default());
    println!("Uno de los dos recupera la dirección de la llave: {}", if y_parity.is_some() { "sí" } else { "no" });
    println!("\n✔ La firma ya tiene la forma que espera la cadena: r, s en la mitad baja y yParity.");
    Ok(())
}
