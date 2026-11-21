// Paso 6 · El servicio de aprobaciones: verifica datos con tipos, guarda lo legible y no acepta hashes.
use alloy::primitives::{address, b256, Address, Signature, B256};
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

// Lo que el servicio tiene configurado: quién puede aprobar. El dominio y los tipos también son suyos.
const APROBADORES: [Address; 2] = [address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"), address!("70997970C51812dc3A010C7d01b50e0d17dc79C8")];

// Un pedido trae la firma y, o bien los campos de la aprobación, o bien solo un hash.
struct Pedido {
    aprobacion: Option<AprobacionRetiro>,
    hash: Option<B256>,
    firma: Signature,
}

fn recibir(pedido: &Pedido, dominio: &Eip712Domain, registro: &mut Vec<(AprobacionRetiro, Address, Signature)>) -> eyre::Result<String> {
    // Una aprobación no entra como hash: el servicio no podría saber ni guardar qué se aprobó.
    let (Some(aprobacion), None) = (&pedido.aprobacion, pedido.hash) else {
        return Ok("rechazada: llegó un hash y no los campos de la aprobación".to_string());
    };
    // El hash se calcula aquí, con el dominio y los tipos del servicio y los campos que llegaron.
    let firmante = pedido.firma.recover_address_from_prehash(&aprobacion.eip712_signing_hash(dominio))?;
    if !APROBADORES.contains(&firmante) {
        return Ok(format!("rechazada: la firma lleva a {firmante}, que no está en la lista"));
    }
    // Se guardan los campos legibles junto a la firma: cualquiera puede leerlos y verificarla otra vez.
    registro.push((aprobacion.clone(), firmante, pedido.firma));
    Ok(format!("aceptada: firmó {firmante}"))
}

fn main() -> eyre::Result<()> {
    // Llaves de las cuentas de prueba 0 y 2 de Anvil. Son públicas: nunca las uses con fondos reales.
    let aprobador: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;
    let ajeno: PrivateKeySigner = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a".parse()?;

    // El dominio y la aprobación del paso 2.
    let dominio = eip712_domain! { name: "Aprobaciones de retiro", version: "1", chain_id: 1, verifying_contract: address!("CcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"), };
    let aprobacion = AprobacionRetiro { retiro: "RET-0042".to_string(), destino: address!("90F79bf6EB2c4f870365E785982E1f101E93b906"), monto: "25000000000000000000".parse()?, vence: "1798761600".parse()? };
    let mut registro = Vec::new();

    let firma = aprobador.sign_typed_data_sync(&aprobacion, &dominio)?;
    // El hash del paso 1: 32 bytes que no dicen qué aprueban.
    let hash_opaco = b256!("58052a5ff49a4e4c320b0c58ee1a271eb123d4a2fb3ffe0b17eeeb87c6ec047f");
    let con_otro_monto = AprobacionRetiro { monto: "250000000000000000000".parse()?, ..aprobacion.clone() };
    let pedidos = [
        ("Un aprobador de la lista firma los datos con tipos", Pedido { aprobacion: Some(aprobacion.clone()), hash: None, firma }),
        ("Los mismos datos, firmados por una llave que no está en la lista", Pedido { aprobacion: Some(aprobacion.clone()), hash: None, firma: ajeno.sign_typed_data_sync(&aprobacion, &dominio)? }),
        ("La firma del aprobador, con el monto cambiado a 250 ETH", Pedido { aprobacion: Some(con_otro_monto), hash: None, firma }),
        ("Un aprobador de la lista firma un hash de 32 bytes", Pedido { aprobacion: None, hash: Some(hash_opaco), firma: aprobador.sign_hash_sync(&hash_opaco)? }),
    ];
    for (nombre, pedido) in &pedidos {
        println!("{nombre}");
        println!("  {}", recibir(pedido, &dominio, &mut registro)?);
    }

    println!("\nRegistro del servicio: {} aprobación", registro.len());
    for (a, firmante, firma) in &registro {
        println!("  retiro:   {}", a.retiro);
        println!("  destino:  {}", a.destino);
        println!("  monto:    {}", a.monto);
        println!("  vence:    {}", a.vence);
        println!("  firmante: {firmante}");
        println!("  firma:    0x{}", hex::encode(firma.as_bytes()));
    }
    println!("\n✔ Entró una sola aprobación, y el registro dice en claro qué se aprobó y quién lo firmó.");
    Ok(())
}
