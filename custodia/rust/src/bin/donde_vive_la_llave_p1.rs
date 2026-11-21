// Paso 1 · Un archivo en claro: quien puede leer el archivo tiene la llave.
use alloy::primitives::{keccak256, B256};
use alloy::signers::{local::PrivateKeySigner, SignerSync};
use std::fs;
use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
use std::{io::Write, path::Path};

// Llave de prueba n.º 0 de Anvil. Es PÚBLICA: sirve para practicar y para nada más.
const LLAVE_DE_PRUEBA: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TMP: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../donde-vive-la-llave/tmp");

// Lee la llave de un archivo y firma el hash con ella.
fn firmar_con(archivo: &Path, hash: &B256) -> eyre::Result<(String, String)> {
    let llave: PrivateKeySigner = fs::read_to_string(archivo)?.trim().parse()?;
    let firma = llave.sign_hash_sync(hash)?;
    Ok((llave.address().to_string(), format!("0x{}", hex::encode(firma.as_bytes()))))
}

fn main() -> eyre::Result<()> {
    // Lo que se firma en todo el laboratorio: siempre estos 32 bytes.
    let hash = keccak256("Orden de retiro 42: 1 ETH para Ana");
    let archivo = Path::new(TMP).join("llave.txt");
    let respaldo = Path::new(TMP).join("respaldo/llave.txt");

    // Guardar: la llave queda escrita tal cual. Permisos 600: solo el dueño del archivo lo lee.
    fs::create_dir_all(Path::new(TMP).join("respaldo"))?;
    let mut nuevo = fs::OpenOptions::new().write(true).create(true).truncate(true).mode(0o600).open(&archivo)?;
    writeln!(nuevo, "{LLAVE_DE_PRUEBA}")?;
    let datos = fs::metadata(&archivo)?;
    println!("Lugar 1 · un archivo en claro");
    println!("  Archivo:   donde-vive-la-llave/tmp/llave.txt ({} bytes, permisos {:o})", datos.len(), datos.permissions().mode() & 0o777);
    println!("  Contenido: {}", fs::read_to_string(&archivo)?.trim());

    let (direccion, firma) = firmar_con(&archivo, &hash)?;
    println!("\nFirmar con la llave del archivo");
    println!("  Hash:      {hash}");
    println!("  Dirección: {direccion}");
    println!("  Firma:     {firma}");

    println!("\nDónde está la llave");
    println!("  En el disco: en claro, antes y después de firmar.");
    println!("  En la memoria del programa: desde que lee el archivo.");

    // Un respaldo, una copia a otra máquina o un `cat` de otro programa: todos copian la llave.
    fs::copy(&archivo, &respaldo)?;
    let (_, firma_de_la_copia) = firmar_con(&respaldo, &hash)?;
    println!("\nQuien lee el archivo obtiene la llave completa");
    println!("  Copia de respaldo: donde-vive-la-llave/tmp/respaldo/llave.txt");
    println!("  Firma hecha solo con la copia: {}", if firma_de_la_copia == firma { "idéntica a la de arriba" } else { "DISTINTA" });
    println!("✔ Archivo en claro: leerlo es tener la llave. La copia firma igual que el original.");
    Ok(())
}
