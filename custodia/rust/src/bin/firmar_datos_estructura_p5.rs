// Paso 5 · La misma firma con el mensaje cambiado: el monto, el destino o el nombre de un campo.
use alloy::primitives::address;
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use alloy::sol;
use alloy::sol_types::{eip712_domain, SolStruct};

sol! {
    struct AprobacionRetiro {
        string retiro;
        address destino;
        uint256 monto;
        uint256 vence;
    }
}

// El último caso no toca ningún valor: solo llama «beneficiario» al campo que se firmó como «destino».
mod otros_tipos {
    alloy::sol! {
        struct AprobacionRetiro {
            string retiro;
            address beneficiario;
            uint256 monto;
            uint256 vence;
        }
    }
}

fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let aprobador: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;

    // El dominio y la aprobación del paso 2.
    let dominio = eip712_domain! { name: "Aprobaciones de retiro", version: "1", chain_id: 1, verifying_contract: address!("CcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"), };
    let aprobacion = AprobacionRetiro { retiro: "RET-0042".to_string(), destino: address!("90F79bf6EB2c4f870365E785982E1f101E93b906"), monto: "25000000000000000000".parse()?, vence: "1798761600".parse()? };

    // La firma se hace una sola vez, sobre la aprobación original.
    let firma = aprobador.sign_typed_data_sync(&aprobacion, &dominio)?;
    println!("Aprobó:  {}", aprobador.address());
    println!("Firma:   0x{}\n", hex::encode(firma.as_bytes()));

    // Alguien presenta la firma junto a un mensaje retocado. El dominio es el correcto en los cuatro casos.
    let otro_monto = AprobacionRetiro { monto: "250000000000000000000".parse()?, ..aprobacion.clone() };
    let otro_destino = AprobacionRetiro { destino: address!("15d34AAf54267DB7D7c367839AAf71A00a2C6A65"), ..aprobacion.clone() };
    let otro_nombre = otros_tipos::AprobacionRetiro { retiro: aprobacion.retiro.clone(), beneficiario: aprobacion.destino, monto: aprobacion.monto, vence: aprobacion.vence };
    let casos = [
        ("El mensaje que se firmó", aprobacion.eip712_signing_hash(&dominio)),
        ("Monto: 250 ETH en lugar de 25", otro_monto.eip712_signing_hash(&dominio)),
        ("Destino: 0x15d3…6A65", otro_destino.eip712_signing_hash(&dominio)),
        ("Mismos valores, el campo «destino» se llama «beneficiario»", otro_nombre.eip712_signing_hash(&dominio)),
    ];
    for (nombre, digest) in casos {
        let recuperada = firma.recover_address_from_prehash(&digest)?;
        println!("{nombre}");
        println!("  digest:     {digest}");
        println!("  recuperada: {recuperada}");
        println!("  {}", if recuperada == aprobador.address() { "Es quien aprobó." } else { "No es quien aprobó: la firma no cubre este mensaje." });
    }
    println!("\n✔ Valores, nombres y tipos están dentro de lo firmado: cambiar uno cambia el digest.");
    Ok(())
}
