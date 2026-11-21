// Paso 3 · Calcular a mano el hash que firma EIP-712 y comprobar que es el de la librería.
use alloy::primitives::{address, keccak256, U256};
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use alloy::sol;
use alloy::sol_types::{eip712_domain, SolStruct, SolValue};

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
    let contrato = address!("CcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC");
    let dominio = eip712_domain! { name: "Aprobaciones de retiro", version: "1", chain_id: 1, verifying_contract: contrato, };
    let aprobacion = AprobacionRetiro { retiro: "RET-0042".to_string(), destino: address!("90F79bf6EB2c4f870365E785982E1f101E93b906"), monto: "25000000000000000000".parse()?, vence: "1798761600".parse()? };

    // 1. El tipo se escribe como un texto, con los nombres de los campos, y de ese texto sale el typeHash.
    let texto_tipo = "AprobacionRetiro(string retiro,address destino,uint256 monto,uint256 vence)";
    let type_hash = keccak256(texto_tipo);
    println!("1. Tipo:       {texto_tipo}");
    println!("   typeHash:   {type_hash}");

    // 2. hashStruct: el typeHash y cada valor en 32 bytes, en el orden del tipo. Un string entra como su hash.
    let hash_mensaje = keccak256((type_hash, keccak256(&aprobacion.retiro), aprobacion.destino, aprobacion.monto, aprobacion.vence).abi_encode());
    println!("2. hashStruct: {hash_mensaje}");

    // 3. El dominio es otra estructura, EIP712Domain, y se trata igual. Su hash es el separador de dominio.
    let texto_dominio = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    let separador = keccak256((keccak256(texto_dominio), keccak256("Aprobaciones de retiro"), keccak256("1"), U256::from(1), contrato).abi_encode());
    println!("3. Dominio:    {texto_dominio}");
    println!("   separador:  {separador}");

    // 4. Lo que se firma es el hash de 66 bytes: 0x19, 0x01, el separador y el hashStruct del mensaje.
    let sobre = [&[0x19, 0x01][..], separador.as_slice(), hash_mensaje.as_slice()].concat();
    let digest = keccak256(&sobre);
    println!("4. 0x1901 + separador + hashStruct = {} bytes", sobre.len());
    println!("   digest:     {digest}");

    // La librería llega al mismo hash partiendo del dominio, los tipos y el mensaje.
    let de_la_libreria = aprobacion.eip712_signing_hash(&dominio);
    println!("\nLa librería:   {de_la_libreria}");
    println!("Son iguales:   {}", if digest == de_la_libreria { "sí" } else { "no" });

    // La firma del paso 2 es una firma corriente sobre ese digest: de los dos sale quien firmó.
    let firma = aprobador.sign_typed_data_sync(&aprobacion, &dominio)?;
    let recuperada = firma.recover_address_from_prehash(&digest)?;
    println!("\nFirma del paso 2: 0x{}", hex::encode(firma.as_bytes()));
    println!("Recuperada con el digest hecho a mano: {recuperada}");
    println!("\n✔ Firmar datos con tipos es firmar un hash de 32 bytes que cualquiera puede recalcular desde los campos.");
    Ok(())
}
