// Paso 4 · Con dos firmas que comparten r, cualquiera calcula k y después la llave privada.
// Este archivo no contiene la llave: solo datos que el firmante publicó.
use alloy::signers::local::PrivateKeySigner;
use k256::elliptic_curve::ops::Reduce;
use k256::{Scalar, U256};
use sha3::{Digest, Keccak256};

// Un Scalar es un número módulo n: restar, multiplicar e invertir ya son módulo n.
fn escalar(bytes: &[u8]) -> Scalar {
    Scalar::reduce(U256::from_be_slice(bytes))
}
fn de_hex(texto: &str) -> Scalar {
    escalar(&hex::decode(texto).unwrap())
}
fn hex_de(numero: &Scalar) -> String {
    hex::encode(numero.to_bytes())
}
fn hash_de(mensaje: &str) -> Scalar {
    escalar(&Keccak256::digest(mensaje.as_bytes()))
}

// Lo público: la dirección del firmante, los dos mensajes y las dos firmas del paso 3.
const FIRMANTE: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

fn main() -> eyre::Result<()> {
    let z1 = hash_de("retiro 1: 5 ETH a la cuenta A");
    let z2 = hash_de("retiro 2: 7 ETH a la cuenta B");
    let r = de_hex("4f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa");
    let s1 = de_hex("44810ab3c96b7ed77e1591a307797d04c57eecddb1174a7f1ef858d2bfc23f6f");
    let s2 = de_hex("5a7a9b5759099167a1105baf9f92314f1c9c2a6dae33170a5dfc792a91d187ac");

    println!("Dirección del firmante: {FIRMANTE}");
    println!("r compartido: 0x{}", hex_de(&r));

    // Como s se publica en su mitad baja, el s2 original puede ser s2 o n − s2: hay dos candidatos.
    let mut recuperada = None;
    for (nombre, candidato) in [("s2", s2), ("n − s2", -s2)] {
        let k = (z1 - z2) * (s1 - candidato).invert().unwrap(); // k = (z1 − z2) / (s1 − s2)
        let d = (s1 * k - z1) * r.invert().unwrap(); // d = (s1·k − z1) / r
        let direccion = PrivateKeySigner::from_slice(&d.to_bytes())?.address().to_string();
        let coincide = direccion == FIRMANTE;
        println!("\nCandidato con {nombre}");
        println!("  k = 0x{}\n  d = 0x{}", hex_de(&k), hex_de(&d));
        println!("  dirección de d: {direccion} ({})", if coincide { "es la del firmante" } else { "no es la del firmante" });
        if coincide {
            recuperada = Some(d);
        }
    }

    let Some(recuperada) = recuperada else {
        println!("\n✖ Ningún candidato da la dirección del firmante: revisa que las dos firmas tengan el mismo r.");
        std::process::exit(1);
    };
    println!("\nLlave privada recuperada: 0x{}", hex_de(&recuperada));
    println!("\n✔ Dos firmas con el mismo r y dos divisiones bastan para tener la llave. No hizo falta acceder al firmante.");
    Ok(())
}
