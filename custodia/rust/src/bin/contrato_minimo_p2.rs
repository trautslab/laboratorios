// Paso 2 · Qué produce el compilador: la interfaz (ABI) y los bytes que se suben a la cadena.
use alloy::primitives::keccak256;
use serde_json::Value;

fn main() -> eyre::Result<()> {
    let texto = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../contrato-minimo/contratos/out/Contador.json"))?;
    let artefacto: Value = serde_json::from_str(&texto)?;
    let bytes = |campo: &str| (artefacto[campo]["object"].as_str().unwrap_or("0x").len() - 2) / 2;

    println!("Compilador: solc {}", artefacto["solc"].as_str().unwrap_or("?"));
    println!("Código de creación: {} bytes (se envía una vez, al desplegar)", bytes("bytecode"));
    println!("Código que queda:   {} bytes (lo que guarda la cadena)\n", bytes("deployedBytecode"));

    // Cada función se llama por un selector: los 4 primeros bytes del keccak256 de su firma.
    println!("Funciones del ABI:");
    for entrada in artefacto["abi"].as_array().into_iter().flatten().filter(|e| e["type"] == "function") {
        let tipos: Vec<&str> = entrada["inputs"].as_array().into_iter().flatten().filter_map(|i| i["type"].as_str()).collect();
        let firma = format!("{}({})", entrada["name"].as_str().unwrap_or(""), tipos.join(","));
        let selector = &keccak256(firma.as_bytes())[..4];
        let tipo = if entrada["stateMutability"] == "view" { "lee" } else { "escribe" };
        println!("  {firma:<16} selector 0x{}  {tipo}", hex::encode(selector));
    }
    println!("\n✔ El ABI dice cómo hablarle al contrato; el código es lo que la cadena ejecuta.");
    Ok(())
}
