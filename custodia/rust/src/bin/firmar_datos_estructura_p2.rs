// Paso 2 · La misma aprobación como datos con tipos (EIP-712): la wallet puede mostrar cada campo.
use alloy::primitives::address;
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use alloy::sol;
use alloy::sol_types::{eip712_domain, SolStruct};

// Los tipos dicen qué campos tiene una aprobación: nombre, tipo y orden. Se escriben como en Solidity.
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

    // El dominio dice dónde vale la firma: qué aplicación, qué versión, qué red y qué contrato la verifica.
    let dominio = eip712_domain! {
        name: "Aprobaciones de retiro",
        version: "1",
        chain_id: 1,
        verifying_contract: address!("CcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"),
    };

    // El mensaje: una aprobación concreta. 25 ETH en wei; vence el 1 de enero de 2027.
    let aprobacion = AprobacionRetiro {
        retiro: "RET-0042".to_string(),
        destino: address!("90F79bf6EB2c4f870365E785982E1f101E93b906"),
        monto: "25000000000000000000".parse()?,
        vence: "1798761600".parse()?,
    };

    // Esto es lo que recibe la wallet. Como trae nombres y tipos, puede mostrarlo antes de pedir la firma.
    println!("Lo que la wallet puede mostrar antes de firmar:");
    println!("  Aplicación: {} (versión {})", dominio.name.as_deref().unwrap_or_default(), dominio.version.as_deref().unwrap_or_default());
    println!("  Red:        chain id {}", dominio.chain_id.unwrap_or_default());
    println!("  Contrato:   {}", dominio.verifying_contract.unwrap_or_default());
    println!("  {}", AprobacionRetiro::NAME);
    println!("    retiro   string   {}", aprobacion.retiro);
    println!("    destino  address  {}", aprobacion.destino);
    println!("    monto    uint256  {}", aprobacion.monto);
    println!("    vence    uint256  {}", aprobacion.vence);

    // La librería calcula el hash a partir del dominio, los tipos y el mensaje, y firma ese hash.
    let firma = aprobador.sign_typed_data_sync(&aprobacion, &dominio)?;
    println!("\nFirma ({} bytes):", firma.as_bytes().len());
    println!("0x{}", hex::encode(firma.as_bytes()));

    // Verificar pide lo mismo que firmar: los datos completos. De ellos y la firma sale quién firmó.
    let recuperada = firma.recover_address_from_prehash(&aprobacion.eip712_signing_hash(&dominio))?;
    println!("\nDirección recuperada:  {recuperada}");
    println!("Dirección de la llave: {}", aprobador.address());
    println!("\n✔ Lo firmado trae aplicación, red, contrato y cuatro campos con nombre: hay algo que leer antes de aprobar.");
    Ok(())
}
