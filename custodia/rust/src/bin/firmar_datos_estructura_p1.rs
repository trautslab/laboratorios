// Paso 1 · Firmar el hash de una aprobación: quien firma solo ve 32 bytes.
use alloy::primitives::{address, keccak256, Address, B256, U256};
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use alloy::sol_types::SolValue;

// Una aprobación de retiro, como la conoce la aplicación.
struct Aprobacion {
    retiro: &'static str,
    destino: Address,
    monto: U256,
    vence: U256,
}

// La aplicación junta los cuatro valores a su manera y calcula un hash. Eso es lo que manda a firmar.
fn hash_de(a: &Aprobacion) -> B256 {
    keccak256((a.retiro.to_string(), a.destino, a.monto, a.vence).abi_encode_params())
}

fn main() -> eyre::Result<()> {
    // Llave de la cuenta de prueba 0 de Anvil. Es pública: nunca la uses con fondos reales.
    let aprobador: PrivateKeySigner = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".parse()?;

    // Dos aprobaciones de retiro. El monto va en wei (25 ETH) y el vencimiento en segundos desde 1970.
    let a = Aprobacion { retiro: "RET-0042", destino: address!("90F79bf6EB2c4f870365E785982E1f101E93b906"), monto: "25000000000000000000".parse()?, vence: U256::from(1798761600u64) };
    // La B cambia el destino y multiplica el monto por diez.
    let b = Aprobacion { retiro: "RET-0042", destino: address!("15d34AAf54267DB7D7c367839AAf71A00a2C6A65"), monto: "250000000000000000000".parse()?, vence: U256::from(1798761600u64) };

    for (titulo, x) in [("Aprobación A, la que la persona cree aprobar:", &a), ("Aprobación B, con otro destino y diez veces el monto:", &b)] {
        println!("{titulo}");
        println!("  retiro:  {}", x.retiro);
        println!("  destino: {}", x.destino);
        println!("  monto:   {}", x.monto);
        println!("  vence:   {}", x.vence);
        println!("  En la pantalla de quien firma: {}\n", hash_de(x));
    }

    // A la persona le llega el hash de B. No tiene con qué distinguirlo del de A, y firma.
    let firma = aprobador.sign_hash_sync(&hash_de(&b))?;
    println!("La persona firma el hash que le llegó, el de B:");
    println!("  firma ({} bytes): 0x{}", firma.as_bytes().len(), hex::encode(firma.as_bytes()));

    // La firma es correcta: del hash y la firma se recupera la dirección de quien firmó.
    let recuperada = firma.recover_address_from_prehash(&hash_de(&b))?;
    println!("  dirección recuperada: {recuperada}");
    println!("  dirección de la llave: {}", aprobador.address());
    println!("\n✔ La firma vale para B. En la pantalla hubo 32 bytes: nada decía a quién ni cuánto.");
    Ok(())
}
