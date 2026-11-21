// Paso 3 · Un firmante con el azar roto: usa el mismo k para dos mensajes distintos.
use k256::ecdsa::signature::hazmat::PrehashVerifier;
use k256::ecdsa::{Signature, SigningKey, VerifyingKey};
use k256::elliptic_curve::ops::Reduce;
use k256::elliptic_curve::point::AffineCoordinates;
use k256::elliptic_curve::scalar::IsHigh;
use k256::{ProjectivePoint, Scalar, U256};
use sha3::{Digest, Keccak256};

const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // cuenta de prueba 0 de Anvil: pública

fn escalar(bytes: &[u8]) -> Scalar {
    Scalar::reduce(U256::from_be_slice(bytes))
}
fn hex_de(numero: &Scalar) -> String {
    hex::encode(numero.to_bytes())
}

// La misma función del paso 2.
fn firmar_con_k(z: Scalar, d: Scalar, k: Scalar) -> (Scalar, Scalar) {
    let punto = (ProjectivePoint::GENERATOR * k).to_affine();
    let r = escalar(&punto.x());
    let mut s = (z + r * d) * k.invert().unwrap();
    if bool::from(s.is_high()) {
        s = -s;
    }
    (r, s)
}

fn main() -> eyre::Result<()> {
    // El generador roto: en lugar de un número nuevo por firma, devuelve siempre este.
    let k_repetido = escalar(&[0x11; 32]);
    let d = escalar(&hex::decode(LLAVE)?);
    let llave_publica = VerifyingKey::from(&SigningKey::from_slice(&hex::decode(LLAVE)?)?);
    let si_no = |valor: bool| if valor { "sí" } else { "no" };

    let mut firmas = Vec::new();
    for mensaje in ["retiro 1: 5 ETH a la cuenta A", "retiro 2: 7 ETH a la cuenta B"] {
        let hash_bytes = Keccak256::digest(mensaje.as_bytes());
        let (r, s) = firmar_con_k(escalar(&hash_bytes), d, k_repetido);
        let valida = llave_publica.verify_prehash(&hash_bytes, &Signature::from_scalars(r, s)?).is_ok();
        firmas.push((mensaje, r, s, valida));
    }

    for (i, (mensaje, r, s, valida)) in firmas.iter().enumerate() {
        println!("Mensaje {}: \"{mensaje}\"", i + 1);
        println!("  r = 0x{}\n  s = 0x{}", hex_de(r), hex_de(s));
        println!("  La librería la acepta: {}", si_no(*valida));
    }
    println!("\nMismo r en las dos firmas: {}", si_no(firmas[0].1 == firmas[1].1));
    println!("Mismo s en las dos firmas: {}", si_no(firmas[0].2 == firmas[1].2));

    println!("\n✔ Las dos firmas son válidas y comparten r. Ese r repetido dice, a cualquiera que las vea, que se usó el mismo k.");
    Ok(())
}
