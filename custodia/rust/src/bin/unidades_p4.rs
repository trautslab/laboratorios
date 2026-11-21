// Paso 4 · Convertir en los bordes: de texto a entero al recibir, de entero a texto al mostrar.
use alloy::primitives::utils::{format_ether, format_units, parse_ether, parse_units};
use alloy::primitives::U256;

// alloy devuelve siempre todos los decimales ("1.500000000000000000"): para mostrar, se recortan los ceros.
fn sin_ceros(texto: String) -> String {
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

fn main() -> eyre::Result<()> {
    println!("De texto a entero (al recibir un monto)");
    println!("  \"1.5\" ETH                  → {} wei", parse_ether("1.5")?);
    println!("  \"0.000000000000000001\" ETH → {} wei", parse_ether("0.000000000000000001")?);
    println!("  \"2.5\" gwei                 → {} wei", parse_units("2.5", "gwei")?);
    // parse_ether y la unidad "gwei" son parse_units con el exponente ya puesto: 18 y 9.
    println!("  \"2.5\" con 9 decimales      → {} wei", parse_units("2.5", 9u8)?);

    let wei = U256::from(1_234_567_890_123_456_789u128);
    let propina = U256::from(2_500_000_000u64);
    println!("\nDe entero a texto (al mostrar un monto)");
    println!("  {wei} wei → {} ETH", sin_ceros(format_ether(wei)));
    println!("  1 wei                   → {} ETH", sin_ceros(format_ether(U256::from(1))));
    println!("  {propina} wei          → {} ETH", sin_ceros(format_ether(propina)));
    println!("  {propina} wei          → {} gwei", sin_ceros(format_units(propina, "gwei")?));

    // Ida y vuelta: el texto que sale vuelve a dar el mismo entero.
    let vuelta = parse_ether(&format_ether(wei))?;
    let resultado = if vuelta == wei { "igual" } else { "distinto" };
    println!("\nIda y vuelta: {wei} → \"{}\" → {vuelta} ({resultado})", sin_ceros(format_ether(wei)));
    println!("\n✔ Convertir es mover el punto decimal en un texto. No hay coma flotante en el camino.");
    Ok(())
}
