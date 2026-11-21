// Paso 3 · De la semilla sale un árbol de llaves. Un camino nombra una llave del árbol.
use alloy::primitives::Address;
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::{coins_bip39::English, MnemonicBuilder};

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE: &str = "test test test test test test test test test test test junk";

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);
    let Ok(de_anvil) = cadena.get_accounts().await else {
        eprintln!("✖ No hay cadena en http://127.0.0.1:8545. Abre otra terminal y corre: npx anvil");
        std::process::exit(1);
    }; // por dentro: eth_accounts, las cuentas que Anvil derivó al arrancar
    let en_anvil = |direccion: Address| match de_anvil.iter().position(|cuenta| *cuenta == direccion) {
        Some(i) => format!("es la cuenta ({i}) de Anvil"),
        None => "no es una cuenta de Anvil".to_string(),
    };

    // Frase → semilla → raíz del árbol (m) → camino: el constructor hace los cuatro pasos.
    for i in 0..3 {
        let camino = format!("m/44'/60'/0'/0/{i}");
        let firmante = MnemonicBuilder::<English>::default().phrase(FRASE).derivation_path(&camino)?.build()?;
        let (llave, direccion) = (firmante.to_bytes(), firmante.address());
        println!("{camino}\n  llave privada {llave}\n  dirección     {direccion}\n  {}", en_anvil(direccion));
    }

    // Para el camino habitual de Ethereum basta el índice.
    let novena = MnemonicBuilder::from_phrase_nth(FRASE, 9).address();
    println!("\nEn una llamada, el índice 9: {novena}\n  {}", en_anvil(novena));

    // El árbol no termina en lo que Anvil muestra: cambia un número del camino y hay otra llave.
    let otra = MnemonicBuilder::<English>::default().phrase(FRASE).derivation_path("m/44'/60'/1'/0/0")?.build()?.address();
    println!("\nOtra rama, m/44'/60'/1'/0/0: {otra}\n  {}", en_anvil(otra));
    println!("\n✔ Con la frase y el camino se recupera cada llave. Anvil no guarda nada más que eso.");
    Ok(())
}
