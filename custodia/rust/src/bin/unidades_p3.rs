// Paso 3 · Qué le pasa a un monto en wei dentro de un f64, y qué pasa dentro de un U256.
use alloy::primitives::U256;

fn main() -> eyre::Result<()> {
    let monto: u128 = 1_234_567_890_123_456_789; // 1.234567890123456789 ETH, en wei

    println!("Con coma flotante de 64 bits (Number en JavaScript, f64 en Rust)");
    // Un f64 tiene 53 bits para las cifras (MANTISSA_DIGITS): de ahí sale el límite.
    println!("  Entero seguro más grande: {} (2^53 - 1)", (1u64 << f64::MANTISSA_DIGITS) - 1);
    println!("  2^53 + 1                = {}", 2f64.powi(53) + 1.0);
    // `as f64` busca el valor de 64 bits más cercano. `as u128` lo muestra sin redondear al imprimir.
    let ida = monto as f64 as u128;
    println!("  {monto} wei → {ida} wei (cambió {} wei)", monto - ida);
    // El error clásico: pasar ETH a wei multiplicando por 1e18.
    let mal = ("1.1".parse::<f64>()? * 1e18) as u128;
    println!("  \"1.1\" ETH × 10^18       = {mal} wei (sobran {} wei)", mal - 11 * 10u128.pow(17));
    println!("  0.1 + 0.2               = {}", 0.1_f64 + 0.2_f64);

    println!("\nCon enteros (BigInt en JavaScript, U256 en Rust)");
    println!("  2^53 + 1                = {}", U256::from(2).pow(U256::from(53)) + U256::from(1));
    let monto = U256::from(monto);
    let vuelta: U256 = monto.to_string().parse()?; // a texto y de vuelta: así se guarda y se envía
    println!("  {monto} wei → {vuelta} wei (cambió {} wei)", monto - vuelta);
    let decima = U256::from(10).pow(U256::from(17)); // 0.1 ETH en wei
    println!("  1.1 ETH = 11 × 10^17    = {} wei", U256::from(11) * decima);
    println!("  0.1 ETH + 0.2 ETH       = {} wei", decima + U256::from(2) * decima);

    println!("\n✔ Un monto en wei no cabe en un Number. Como entero, no se pierde ni un wei.");
    Ok(())
}
