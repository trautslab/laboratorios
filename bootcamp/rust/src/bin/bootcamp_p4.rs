// Paso 4 · Una cadena permisionada mínima: tres bloques encadenados, firmados por validadores autorizados.
use alloy::primitives::Address;
use bootcamp::{corto, hoja, keccak, raiz, H32};
use k256::ecdsa::{RecoveryId, Signature, SigningKey, VerifyingKey};

// Llaves fijas de prueba (32 bytes al azar, sacados una vez). Solo A y B están autorizados.
const LLAVES: [(&str, &str); 3] = [
    ("Validador A", "54588faf3350361f4e514c7c44f91ba27f4547542c37b931d3c9e7e939edc610"),
    ("Validador B", "0df35d829e76752a0c83a6578e2b9d8fc40e40e2b00d985cbad9f3e040e275a7"),
    ("Intruso", "66e041329d4e8613ee290358fd35e77675114b276afda2ad7a6f0f3a12994a9e"),
];
fn llave(nombre: &str) -> SigningKey {
    let (_, h) = LLAVES.iter().find(|(n, _)| *n == nombre).unwrap();
    SigningKey::from_slice(&hex::decode(h).unwrap()).unwrap()
}
fn direccion(pub_: &VerifyingKey) -> Address {
    Address::from_slice(&keccak(&pub_.to_encoded_point(false).as_bytes()[1..])[12..])
}
fn direccion_de(nombre: &str) -> Address {
    direccion(llave(nombre).verifying_key())
}
fn nombre_de(dir: Address) -> &'static str {
    LLAVES.iter().find(|(n, _)| direccion_de(n) == dir).map(|(n, _)| *n).unwrap_or("desconocido")
}

#[derive(Clone)]
struct Bloque { numero: u64, anterior: H32, timestamp: u64, raiz_tx: H32, nonce: u64, transacciones: Vec<String>, firma: Option<(Signature, RecoveryId)> }

// Cabecera: número (8 bytes) ‖ anterior (32) ‖ timestamp (8) ‖ raíz de transacciones (32) ‖ nonce (8) = 88 bytes.
fn cabecera(b: &Bloque) -> Vec<u8> {
    [&b.numero.to_be_bytes()[..], &b.anterior, &b.timestamp.to_be_bytes(), &b.raiz_tx, &b.nonce.to_be_bytes()].concat()
}
fn hash_de(b: &Bloque) -> H32 { keccak(&cabecera(b)) }
fn raiz_de(txs: &[String]) -> H32 { raiz(&txs.iter().map(|t| hoja(t)).collect::<Vec<_>>()) }

// Quién firmó: se recupera la llave pública desde el hash y la firma (r, s, recovery), como en el paso 3.
fn firmante_de(b: &Bloque) -> Address {
    let (firma, recovery) = b.firma.expect("el bloque está firmado");
    direccion(&VerifyingKey::recover_from_prehash(&hash_de(b), &firma, recovery).unwrap())
}

// Producir un bloque: armar la cabecera y que un validador firme su hash.
fn producir(numero: u64, anterior: H32, transacciones: &[&str], quien: &str) -> Bloque {
    // Sin prueba de trabajo, el nonce no tiene nada que buscar: queda en 0, como en Ethereum desde The Merge.
    let transacciones: Vec<String> = transacciones.iter().map(|t| t.to_string()).collect();
    let mut b = Bloque { numero, anterior, timestamp: 1767225600 + 12 * numero, raiz_tx: raiz_de(&transacciones), nonce: 0, transacciones, firma: None };
    b.firma = Some(llave(quien).sign_prehash_recoverable(&hash_de(&b)).unwrap());
    b
}

// El verificador recalcula todo y no confía en nada que no pueda comprobar.
fn verificar(titulo: &str, bloques: &[Bloque], autorizados: &[Address]) {
    println!("\n{titulo}");
    let mut valida = true;
    for (i, b) in bloques.iter().enumerate() {
        let mut errores = vec![];
        let esperado = if i == 0 { [0u8; 32] } else { hash_de(&bloques[i - 1]) };
        if b.numero != i as u64 { errores.push(format!("número {}, se esperaba {i}", b.numero)); }
        if b.anterior != esperado { errores.push(format!("«anterior» dice {}, pero el bloque {} hoy da {}", corto(&b.anterior), i as i64 - 1, corto(&esperado))); }
        if i > 0 && b.timestamp <= bloques[i - 1].timestamp { errores.push("timestamp no avanza".into()); }
        if b.raiz_tx != raiz_de(&b.transacciones) { errores.push("la raíz no corresponde a las transacciones".into()); }
        let firmante = firmante_de(b);
        if !autorizados.contains(&firmante) { errores.push(format!("firmado por {firmante}, que no está en la lista")); }
        if errores.is_empty() { println!("  bloque {i}: ok (firmó {})", nombre_de(firmante)); } else { println!("  bloque {i}: RECHAZADO: {}", errores.join("; ")); }
        valida &= errores.is_empty();
    }
    println!("  → cadena {}", if valida { "válida" } else { "inválida" });
}

fn main() {
    let autorizados = [direccion_de("Validador A"), direccion_de("Validador B")];
    let tx: [&[&str]; 3] = [
        &["Alta del validador A", "Alta del validador B"],
        &["Registro de la raíz 0x710c03…a403", "Ana Rojas pide su certificado"],
        &["Elena Ruiz verifica el certificado 0045", "Beto Díaz pide su certificado"],
    ];
    let mut cadena: Vec<Bloque> = vec![];
    for i in 0..3 {
        let anterior = if i == 0 { [0u8; 32] } else { hash_de(&cadena[i - 1]) };
        cadena.push(producir(i as u64, anterior, tx[i], if i == 1 { "Validador B" } else { "Validador A" }));
    }

    println!("Validadores autorizados:");
    for dir in &autorizados { println!("  {}: {dir}", nombre_de(*dir)); }
    println!("Fuera de la lista:\n  Intruso:     {}", direccion_de("Intruso"));
    for b in &cadena {
        println!("\nBloque {}", b.numero);
        println!("  anterior:  {}", corto(&b.anterior));
        println!("  timestamp: {}{}", b.timestamp, if b.numero > 0 { " (+12 s)" } else { " (fijo, para que la salida se repita)" });
        println!("  raíz tx:   {} ({} transacciones)", corto(&b.raiz_tx), b.transacciones.len());
        println!("  nonce:     {}", b.nonce);
        println!("  cabecera:  {} bytes → hash {}, firmado por {}", cabecera(b).len(), corto(&hash_de(b)), nombre_de(firmante_de(b)));
    }

    verificar("Verificador, cadena tal como se produjo:", &cadena, &autorizados);

    // Alguien cambia una transacción del bloque 1 y, para disimular, recalcula su raíz. No puede volver a firmar.
    let mut mutada = cadena.clone();
    mutada[1].transacciones[1] = "Ana Rojas recibe 10 certificados".into();
    mutada[1].raiz_tx = raiz_de(&mutada[1].transacciones);
    verificar("Bloque 1 mutado (una transacción cambiada y la raíz recalculada):", &mutada, &autorizados);

    // Un bloque bien formado, pero firmado por alguien fuera de la lista.
    let mut intrusa = cadena[..2].to_vec();
    intrusa.push(producir(2, hash_de(&cadena[1]), tx[2], "Intruso"));
    verificar("Bloque 2 firmado por el intruso:", &intrusa, &autorizados);
    println!("\n✔ El verificador acepta la cadena original y rechaza el bloque mutado y el del intruso.");
}
