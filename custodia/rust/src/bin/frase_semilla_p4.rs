// Paso 4 · La misma frase con una passphrase da otra semilla y, con ella, otro árbol entero.
use alloy::signers::local::coins_bip39::{English, Mnemonic};
use alloy::signers::local::MnemonicBuilder;

// La frase de prueba que imprime Anvil. Es pública: nunca le envíes fondos.
const FRASE: &str = "test test test test test test test test test test test junk";
const CAMINO: &str = "m/44'/60'/0'/0/0";

fn main() -> eyre::Result<()> {
    println!("La misma frase y el mismo camino, {CAMINO}. Solo cambia la passphrase.\n");
    for passphrase in ["", "custodia", "Custodia"] {
        // La passphrase entra en la sal de PBKDF2: «mnemonic» + passphrase. Vacía es lo normal.
        let semilla = Mnemonic::<English>::new_from_phrase(FRASE)?.to_seed(Some(passphrase))?;
        let firmante = MnemonicBuilder::<English>::default().phrase(FRASE).password(passphrase).derivation_path(CAMINO)?.build()?;
        if passphrase.is_empty() { println!("Sin passphrase") } else { println!("Passphrase «{passphrase}»") }
        println!("  semilla   0x{}… (primeros 8 de 64 bytes)", hex::encode(&semilla[..8]));
        println!("  dirección {}", firmante.address());
    }
    println!("\nNinguna fue rechazada: toda passphrase es válida y lleva a un árbol distinto.");
    println!("\n✔ Las mismas 12 palabras con otra passphrase dan otras direcciones, sin ningún aviso.");
    Ok(())
}
