// Paso 5 · Lo hecho a mano, contra la librería y contra la cadena. Y una llave nueva que ya recibe.
use alloy::network::TransactionBuilder;
use alloy::primitives::{utils::format_ether, utils::parse_ether, Address};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;
use k256::elliptic_curve::rand_core::{OsRng, RngCore};
use k256::elliptic_curve::sec1::ToEncodedPoint;
use sha3::{Digest, Keccak256};

const NODO: &str = "http://127.0.0.1:8545";
// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Los pasos 2, 3 y 4 en una función: punto de la curva, Keccak-256, últimos 20 bytes, mayúsculas.
fn direccion_de(llave: &[u8]) -> String {
    let privada = k256::SecretKey::from_slice(llave).expect("un número entre 1 y n − 1");
    let punto = privada.public_key().to_encoded_point(false);
    let minusculas = hex::encode(&Keccak256::digest(&punto.as_bytes()[1..])[12..]);
    let hash = hex::encode(Keccak256::digest(minusculas.as_bytes()));
    let letras = minusculas.chars().zip(hash.chars()).map(|(letra, digito)| if digito >= '8' { letra.to_ascii_uppercase() } else { letra });
    format!("0x{}", letras.collect::<String>())
}

async fn saldo_de(cadena: &impl Provider, direccion: &str) -> eyre::Result<String> {
    let saldo = format_ether(cadena.get_balance(direccion.parse::<Address>()?).await?);
    Ok(format!("{} ETH", saldo.trim_end_matches('0').trim_end_matches('.')))
}

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let a_mano = direccion_de(&hex::decode(LLAVE)?);
    let firmante: PrivateKeySigner = LLAVE.parse()?; // la librería hace el mismo camino en una llamada
    let de_la_libreria = firmante.address().to_string();
    println!("A mano, pasos 2 a 4:      {a_mano}");
    println!("La librería, una llamada: {de_la_libreria}");
    println!("¿Iguales? {}", if a_mano == de_la_libreria { "sí" } else { "no" });

    let cadena = ProviderBuilder::new().wallet(firmante).connect_http(NODO.parse()?);
    // La cadena nunca vio la llave. Solo conoce la dirección, y es la misma que calculaste.
    let Ok(saldo) = saldo_de(&cadena, &a_mano).await else {
        eprintln!("✖ No hay cadena en {NODO}. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    };
    println!("\nLa cadena, por esa dirección: saldo {saldo}");

    // Una llave que no existía hace un instante. Su dirección se calcula igual, sin avisarle a nadie.
    let mut nueva = [0u8; 32];
    OsRng.fill_bytes(&mut nueva);
    let direccion_nueva = direccion_de(&nueva);
    println!("\nUna llave nueva, recién generada:");
    println!("≈ Llave nueva: 0x{}", hex::encode(nueva));
    println!("≈ Su dirección: {direccion_nueva}");
    println!("Saldo antes:   {} (la cadena responde aunque nadie registró esa dirección)", saldo_de(&cadena, &direccion_nueva).await?);
    let pedido = TransactionRequest::default().with_to(direccion_nueva.parse()?).with_value(parse_ether("1")?);
    cadena.send_transaction(pedido).await?.get_receipt().await?;
    println!("Le envío 1 ETH desde la cuenta de prueba.");
    println!("Saldo después: {}", saldo_de(&cadena, &direccion_nueva).await?);
    println!("\n✔ De la llave a la dirección hay tres cálculos locales y ningún registro: la dirección nueva ya recibió.");
    Ok(())
}
