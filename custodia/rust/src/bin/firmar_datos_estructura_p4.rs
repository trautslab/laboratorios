// Paso 4 · La misma firma con otro dominio: otra red, otro contrato u otra aplicación.
use alloy::primitives::{address, U256};
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use alloy::sol;
use alloy::sol_types::{eip712_domain, Eip712Domain, SolStruct};

sol! {
    struct AprobacionRetiro {
        string retiro;
        address destino;
        uint256 monto;
        uint256 vence;
    }
}

fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let aprobador: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;

    // El dominio y la aprobación del paso 2.
    let dominio = eip712_domain! { name: "Aprobaciones de retiro", version: "1", chain_id: 1, verifying_contract: address!("CcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"), };
    let aprobacion = AprobacionRetiro { retiro: "RET-0042".to_string(), destino: address!("90F79bf6EB2c4f870365E785982E1f101E93b906"), monto: "25000000000000000000".parse()?, vence: "1798761600".parse()? };

    // La firma se hace una sola vez, con el dominio original.
    let firma = aprobador.sign_typed_data_sync(&aprobacion, &dominio)?;
    println!("Aprobó:  {}", aprobador.address());
    println!("Firma:   0x{}\n", hex::encode(firma.as_bytes()));

    // Cuatro verificadores reciben la misma firma y el mismo mensaje. Cada uno usa su propio dominio.
    let dominios = [
        ("El dominio con el que se firmó", dominio.clone()),
        ("Otra red: chain id 11155111", Eip712Domain { chain_id: Some(U256::from(11155111)), ..dominio.clone() }),
        ("Otro contrato verificador: 0xbBbB…BBbB", Eip712Domain { verifying_contract: Some(address!("bBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB")), ..dominio.clone() }),
        ("Otra aplicación: «Pagos a proveedores»", Eip712Domain { name: Some("Pagos a proveedores".into()), ..dominio.clone() }),
    ];
    for (nombre, d) in &dominios {
        let digest = aprobacion.eip712_signing_hash(d);
        let recuperada = firma.recover_address_from_prehash(&digest)?;
        println!("{nombre}");
        println!("  digest:     {digest}");
        println!("  recuperada: {recuperada}");
        println!("  {}", if recuperada == aprobador.address() { "Es quien aprobó." } else { "No es quien aprobó: aquí la firma no vale." });
    }
    println!("\n✔ La firma solo lleva a quien aprobó con el dominio exacto con el que se firmó.");
    Ok(())
}
