// Paso 3 · Llave privada, llave pública, dirección y firma de una huella con secp256k1.
use alloy::primitives::{Address, U256};
use bootcamp::{hex0x, huella, keccak, DOCUMENTOS};
use k256::ecdsa::signature::hazmat::PrehashVerifier;
use k256::ecdsa::{SigningKey, VerifyingKey};
use k256::elliptic_curve::bigint::Encoding;
use k256::elliptic_curve::Curve;

// Últimos 20 bytes de keccak256(x ‖ y). Address los muestra con mayúsculas de control (EIP-55).
fn direccion(llave: &VerifyingKey) -> Address {
    Address::from_slice(&keccak(&llave.to_encoded_point(false).as_bytes()[1..])[12..])
}

fn main() -> eyre::Result<()> {
    // En la práctica la llave privada sale del azar del sistema: 32 bytes. Esta línea cambia en cada corrida.
    let al_azar = SigningKey::random(&mut rand_core::OsRng);
    println!("≈ Una llave privada nueva, al azar: {}", hex0x(&al_azar.to_bytes()));

    // Para que la salida se repita, el laboratorio fija una: 32 bytes sacados al azar una vez. No la uses para nada real.
    let privada = SigningKey::from_slice(&hex::decode("9db24b5a373d497d9f5ac62746e3b19d0cca8af007350a80512f9e5341a19127")?)?;
    let n = U256::from_be_slice(&k256::Secp256k1::ORDER.to_be_bytes()); // cuántos puntos tiene el grupo
    let numero = U256::from_be_slice(&privada.to_bytes());
    println!("Llave privada fija (32 bytes): {}", hex0x(&privada.to_bytes()));
    println!("  ¿Está entre 1 y n - 1? {}  (n = {n})", if numero > U256::ZERO && numero < n { "sí" } else { "no" });

    // Pública = privada × G: sumar el punto G de la curva consigo mismo «privada» veces. Volver de la pública a la privada es el problema del logaritmo discreto.
    let publica = privada.verifying_key();
    let punto = publica.to_encoded_point(false); // 65 bytes: 04 + x + y
    println!("\nLlave pública = privada × G, un punto (x, y) de secp256k1:");
    println!("  x: {}", hex0x(punto.x().unwrap()));
    println!("  y: {}", hex0x(punto.y().unwrap()));
    println!("  comprimida (33 bytes): {}", hex0x(publica.to_encoded_point(true).as_bytes()));
    println!("Dirección (últimos 20 bytes de keccak256(x ‖ y)): {}", direccion(publica));

    // Se firma la huella del documento, no el documento: 32 bytes. La firma es determinista (RFC 6979).
    let documento = DOCUMENTOS[4];
    let h = huella(documento);
    let (firma, recovery) = privada.sign_prehash_recoverable(&h)?;
    println!("\nDocumento: «{documento}»");
    println!("Huella que se firma: {}", hex0x(&h));
    println!("  r: {}", hex0x(&firma.r().to_bytes()));
    println!("  s: {}", hex0x(&firma.s().to_bytes()));
    println!("  v: {} (recovery {}: dice cuál de los puntos candidatos es la llave)", 27 + recovery.to_byte(), recovery.to_byte());

    // Con la huella y la firma se recupera la llave pública, y de ella la dirección. Así verifica Ethereum (ecrecover).
    let recuperada = direccion(&VerifyingKey::recover_from_prehash(&h, &firma, recovery)?);
    println!("\nDirección recuperada de (huella, r, s, v): {recuperada}");
    println!("¿Es la del firmante? {}", if recuperada == direccion(publica) { "sí" } else { "no" });
    println!("Verificación con la llave pública: {}", if publica.verify_prehash(&h, &firma).is_ok() { "válida" } else { "NO válida" });

    // Un byte cambiado en el mensaje: otra huella, y la misma firma ya no corresponde.
    let alterado = documento.replace("6.9", "7.9");
    let h2 = huella(&alterado);
    println!("\nMensaje alterado: «{alterado}»");
    println!("Huella: {}", hex0x(&h2));
    println!("Verificación de la misma firma: {}", if publica.verify_prehash(&h2, &firma).is_ok() { "válida" } else { "NO válida" });
    println!("Dirección recuperada: {} (otra cuenta)", direccion(&VerifyingKey::recover_from_prehash(&h2, &firma, recovery)?));
    println!("\n✔ La llave privada firma la huella; con la firma cualquiera recupera la dirección y detecta un cambio.");
    Ok(())
}
