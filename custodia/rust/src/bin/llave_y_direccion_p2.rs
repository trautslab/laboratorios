// Paso 2 · La llave pública es un punto de la curva secp256k1, calculado a partir de la llave privada.
use alloy::primitives::{uint, U256};
use k256::elliptic_curve::sec1::ToEncodedPoint;

// Llave de la cuenta de prueba 0 de Anvil. Es pública: solo sirve en tu máquina.
const LLAVE: &str = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// p: el módulo de las coordenadas. La curva es y² = x³ + 7, con todas las cuentas módulo p.
const P: U256 = uint!(0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f_U256);

// Llave pública = llave privada × G. G es el punto base de la curva, igual para todos.
// `false` pide la forma completa: el byte 04, después x (32 bytes) y después y (32 bytes).
fn publica_de(llave: &[u8]) -> Vec<u8> {
    let privada = k256::SecretKey::from_slice(llave).expect("un número entre 1 y n − 1");
    privada.public_key().to_encoded_point(false).as_bytes().to_vec()
}

fn main() {
    let publica = publica_de(&hex::decode(LLAVE).expect("hexadecimal"));
    let (x, y) = (&publica[1..33], &publica[33..65]);
    println!("Llave privada (32 bytes): 0x{LLAVE}");
    println!("Llave pública ({} bytes): prefijo {}, después x, después y", publica.len(), hex::encode(&publica[..1]));
    println!("  x: 0x{}", hex::encode(x));
    println!("  y: 0x{}", hex::encode(y));

    // Comprobación a mano: (x, y) cumple la ecuación de la curva.
    let (xn, yn) = (U256::from_be_slice(x), U256::from_be_slice(y));
    let izquierda = yn.mul_mod(yn, P);
    let derecha = xn.mul_mod(xn, P).mul_mod(xn, P).add_mod(U256::from(7), P);
    println!("\n¿Es un punto de la curva y² = x³ + 7 (mod p)?");
    println!("  y² mod p:       0x{}", hex::encode(izquierda.to_be_bytes::<32>()));
    println!("  x³ + 7 mod p:   0x{}", hex::encode(derecha.to_be_bytes::<32>()));
    println!("  {}", if izquierda == derecha { "Iguales: sí, es un punto de la curva." } else { "Distintos: no es un punto de la curva." });

    // Llaves vecinas dan puntos sin parecido. La llave 1 da el punto base G tal cual.
    println!("\nLa x de la llave pública de tres llaves vecinas:");
    for numero in [1u64, 2, 3] {
        let vecina = publica_de(&U256::from(numero).to_be_bytes::<32>());
        println!("  llave {numero} → 0x{}{}", hex::encode(&vecina[1..33]), if numero == 1 { " (es G)" } else { "" });
    }
    println!("\n✔ La llave pública son 64 bytes: las coordenadas x, y de un punto. Sale de la llave privada, y no al revés.");
}
