// Paso 2 · Una variable de entorno: fuera del repositorio, a la vista de los procesos de tu usuario.
use alloy::primitives::keccak256;
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use std::{path::Path, process::Command};

// Llave de prueba n.º 0 de Anvil. Es PÚBLICA: por eso puede ir escrita en un comando.
const LLAVE_DE_PRUEBA: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

fn main() -> eyre::Result<()> {
    let hash = keccak256("Orden de retiro 42: 1 ETH para Ana"); // los mismos 32 bytes del paso 1
    let variable = std::env::var("LLAVE_PRIVADA").unwrap_or_default();
    let Ok(llave) = variable.parse::<PrivateKeySigner>() else {
        eprintln!("✖ Falta la variable LLAVE_PRIVADA. Corre: LLAVE_PRIVADA={LLAVE_DE_PRUEBA} cargo run -q --bin donde_vive_la_llave_p2");
        std::process::exit(1);
    };
    println!("Lugar 2 · una variable de entorno");
    println!("  LLAVE_PRIVADA: {} caracteres. El programa no abrió ningún archivo.", variable.len());

    let firma = llave.sign_hash_sync(&hash)?;
    println!("\nFirmar con la llave de la variable");
    println!("  Hash:      {hash}");
    println!("  Dirección: {}", llave.address());
    println!("  Firma:     0x{}", hex::encode(firma.as_bytes()));

    println!("\nDónde está la llave");
    println!("  En el disco: en ningún archivo de este laboratorio.");
    println!("  En la memoria del programa: desde que arranca, con el resto de su entorno.");

    // Un proceso hijo recibe una copia del entorno aunque no le pases nada.
    let hijo = Command::new("/bin/sh").args(["-c", "printf %s \"$LLAVE_PRIVADA\""]).output()?.stdout;
    // Otro proceso, con su propio entorno vacío, lee el de este en /proc (solo Linux).
    let propio = format!("/proc/{}/environ", std::process::id());
    let ajeno = if Path::new(&propio).exists() { Command::new("/bin/cat").arg(&propio).env_clear().output()?.stdout } else { Vec::new() };
    let vista = ajeno.split(|byte| *byte == 0).find_map(|linea| linea.strip_prefix(b"LLAVE_PRIVADA="));
    println!("\nQuién más puede leerla");
    println!("  Un proceso hijo, sin pasarle nada: {}", if hijo == variable.as_bytes() { "la heredó completa" } else { "no la tiene" });
    println!("  Otro proceso de tu usuario, en /proc/<pid>/environ: {}", if vista == Some(variable.as_bytes()) { "la leyó completa" } else { "no la encontró (este sistema no tiene /proc)" });
    println!("✔ Variable de entorno: no está en el repositorio, pero la ven tus procesos hijos y quien lea tu entorno.");
    Ok(())
}
