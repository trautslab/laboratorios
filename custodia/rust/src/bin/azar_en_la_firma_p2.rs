// Paso 2 · La firma escrita a mano, con el número secreto k como parámetro.
use k256::ecdsa::signature::hazmat::{PrehashSigner, PrehashVerifier};
use k256::ecdsa::{Signature, SigningKey, VerifyingKey};
use k256::elliptic_curve::ops::Reduce;
use k256::elliptic_curve::point::AffineCoordinates;
use k256::elliptic_curve::scalar::IsHigh;
use k256::{ProjectivePoint, Scalar, U256};
use sha3::{Digest, Keccak256};

const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // cuenta de prueba 0 de Anvil: pública

// Un Scalar es un número módulo n: sumar, multiplicar e invertir ya son módulo n.
fn escalar(bytes: &[u8]) -> Scalar {
    Scalar::reduce(U256::from_be_slice(bytes))
}
fn hex_de(numero: &Scalar) -> String {
    hex::encode(numero.to_bytes())
}

// Firmar son dos cuentas. z es el hash del mensaje, d la llave privada y k el número secreto.
fn firmar_con_k(z: Scalar, d: Scalar, k: Scalar) -> (Scalar, Scalar) {
    let punto = (ProjectivePoint::GENERATOR * k).to_affine(); // k veces el punto base de la curva
    let r = escalar(&punto.x()); // r sale solo de k
    let mut s = (z + r * d) * k.invert().unwrap(); // s mezcla el mensaje, la llave y k
    if bool::from(s.is_high()) {
        s = -s; // Ethereum solo acepta la mitad baja de s
    }
    (r, s)
}

fn main() -> eyre::Result<()> {
    let hash_bytes = Keccak256::digest("retiro 1: 5 ETH a la cuenta A".as_bytes());
    let z = escalar(&hash_bytes);
    let d = escalar(&hex::decode(LLAVE)?);
    let si_no = |valor: bool| if valor { "sí" } else { "no" };

    // La firma de la librería, como dos números.
    let llave = SigningKey::from_slice(&hex::decode(LLAVE)?)?;
    let firma: Signature = llave.sign_prehash(&hash_bytes)?;
    let (r, s) = (*firma.r(), *firma.s());
    println!("Firma de la librería\n  r = 0x{}\n  s = 0x{}", hex_de(&r), hex_de(&s));

    // La librería no muestra su k. Quien tiene la llave lo puede despejar de la firma: k = (z + r·d) / s.
    let k_libreria = (z + r * d) * s.invert().unwrap();
    let a_mano = firmar_con_k(z, d, k_libreria);
    println!("\nEl k de esa firma, despejado con la llave: 0x{}", hex_de(&k_libreria));
    println!("Firma a mano con ese k\n  r = 0x{}\n  s = 0x{}", hex_de(&a_mano.0), hex_de(&a_mano.1));
    println!("Igual a la de la librería: {}", si_no(a_mano == (r, s)));

    // Con cualquier otro k sale otra firma, y es igual de válida.
    let otro_k = escalar(&[0x11; 32]);
    let otra = firmar_con_k(z, d, otro_k);
    let valida = VerifyingKey::from(&llave).verify_prehash(&hash_bytes, &Signature::from_scalars(otra.0, otra.1)?).is_ok();
    println!("\nFirma a mano con otro k: 0x{}\n  r = 0x{}\n  s = 0x{}", hex_de(&otro_k), hex_de(&otra.0), hex_de(&otra.1));
    println!("La librería la acepta como firma del mismo mensaje: {}", si_no(valida));

    println!("\n✔ Firmar son dos cuentas con k. Quien verifica acepta cualquier k: elegirlo bien es asunto de quien firma.");
    Ok(())
}
