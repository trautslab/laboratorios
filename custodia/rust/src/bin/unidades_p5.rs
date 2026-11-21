// Paso 5 · Los decimales son de cada activo: el mismo "1.5" da enteros distintos.
use alloy::primitives::utils::{format_units, parse_units};
use alloy::primitives::U256;

const ETH: u8 = 18; // decimales de ETH
const DOLAR: u8 = 6; // decimales de la stablecoin de dólar de este ejemplo

// alloy devuelve siempre todos los decimales ("1.500000"): para mostrar, se recortan los ceros.
fn sin_ceros(texto: String) -> String {
    texto.trim_end_matches('0').trim_end_matches('.').to_string()
}

fn main() -> eyre::Result<()> {
    let en_eth: U256 = parse_units("1.5", ETH)?.into();
    let en_dolar: U256 = parse_units("1.5", DOLAR)?.into();
    println!("El mismo texto, dos activos");
    println!("  \"1.5\" con 18 decimales → {en_eth}");
    println!("  \"1.5\" con  6 decimales → {en_dolar}");
    println!("  Un entero es {} veces el otro (10^12)", en_eth / en_dolar);

    println!("\nEl mismo entero, leído con los decimales de otro activo");
    println!("  {en_dolar} con  6 decimales → {} (correcto)", sin_ceros(format_units(en_dolar, DOLAR)?));
    println!("  {en_dolar} con 18 decimales → {}", sin_ceros(format_units(en_dolar, ETH)?));
    println!("  {en_eth} con 18 decimales → {} (correcto)", sin_ceros(format_units(en_eth, ETH)?));
    println!("  {en_eth} con  6 decimales → {}", sin_ceros(format_units(en_eth, DOLAR)?));

    println!("\n✔ El entero no dice cuántos decimales tiene. Ese dato va siempre junto al monto.");
    Ok(())
}
