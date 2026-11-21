// Paso 5 · Detección: recorrer las firmas de un firmante y avisar si un r aparece dos veces.
use k256::elliptic_curve::ops::Reduce;
use k256::elliptic_curve::point::AffineCoordinates;
use k256::elliptic_curve::scalar::IsHigh;
use k256::{ProjectivePoint, Scalar, U256};
use sha3::{Digest, Keccak256};
use std::collections::HashMap;

const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // cuenta de prueba 0 de Anvil: pública

fn escalar(bytes: &[u8]) -> Scalar {
    Scalar::reduce(U256::from_be_slice(bytes))
}
fn hash_de(texto: &str) -> Scalar {
    escalar(&Keccak256::digest(texto.as_bytes()))
}

fn firmar_con_k(z: Scalar, d: Scalar, k: Scalar) -> (Scalar, Scalar) {
    let r = escalar(&(ProjectivePoint::GENERATOR * k).to_affine().x());
    let mut s = (z + r * d) * k.invert().unwrap();
    if bool::from(s.is_high()) {
        s = -s;
    }
    (r, s)
}

// Un generador defectuoso: sus números parecen distintos, pero vuelve a empezar cada cuatro firmas.
fn generar_k(i: usize) -> Scalar {
    hash_de(&format!("azar {}", i % 4))
}

struct Firma {
    mensaje: &'static str,
    z: Scalar,
    r: Scalar,
}

// El control: solo mira datos públicos (r y el hash de cada mensaje).
fn buscar_r_repetido(firmas: &[Firma]) -> Vec<(usize, usize, bool)> {
    let mut vistos: HashMap<String, usize> = HashMap::new(); // r → posición de la primera firma que lo usó
    let mut hallazgos = Vec::new();
    for (i, firma) in firmas.iter().enumerate() {
        let r = hex::encode(firma.r.to_bytes());
        match vistos.get(&r) {
            None => {
                vistos.insert(r, i);
            }
            Some(&antes) => hallazgos.push((antes + 1, i + 1, firmas[antes].z == firma.z)),
        }
    }
    hallazgos
}

fn main() -> eyre::Result<()> {
    // El registro de un firmante: seis firmas. La última es un reintento del mensaje 2.
    let mensajes = [
        "retiro 1: 5 ETH a la cuenta A",
        "retiro 2: 7 ETH a la cuenta B",
        "retiro 3: 1 ETH a la cuenta C",
        "retiro 4: 2 ETH a la cuenta D",
        "retiro 5: 9 ETH a la cuenta E",
        "retiro 2: 7 ETH a la cuenta B",
    ];
    let d = escalar(&hex::decode(LLAVE)?);
    let mut registro = Vec::new();
    for (i, mensaje) in mensajes.into_iter().enumerate() {
        let z = hash_de(mensaje);
        let (r, _s) = firmar_con_k(z, d, generar_k(i));
        registro.push(Firma { mensaje, z, r });
    }

    for (i, firma) in registro.iter().enumerate() {
        println!("Firma {}: r = 0x{}…  \"{}\"", i + 1, &hex::encode(firma.r.to_bytes())[..16], firma.mensaje);
    }
    println!();
    for (primera, segunda, mismo_mensaje) in buscar_r_repetido(&registro) {
        let lectura = if mismo_mensaje { "mismo mensaje → es la misma firma repetida, no revela nada" } else { "mensajes distintos → llave expuesta" };
        println!("Firmas {primera} y {segunda}: mismo r, {lectura}");
    }

    println!("\n✔ Un r repetido con mensajes distintos se detecta con datos públicos. Si aparece, esa llave ya no es secreta.");
    Ok(())
}
