// Paso 2 · Árbol de Merkle: ocho documentos, una raíz y la prueba de que uno está dentro.
use bootcamp::{corto, hex0x, hoja, niveles, prueba, raiz, recalcular, H32, DOCUMENTOS};

fn titulo(texto: &str) -> String {
    texto.split(" · ").take(2).collect::<Vec<_>>().join(" · ")
}
fn juntos(nivel: &[H32]) -> String {
    nivel.iter().map(|h| corto(h)).collect::<Vec<_>>().join("  ")
}

fn main() {
    let hojas: Vec<H32> = DOCUMENTOS.iter().map(|d| hoja(d)).collect();
    let arbol = niveles(&hojas);
    println!("Hojas: {} documentos → hoja = keccak256(huella del documento)", hojas.len());
    for (i, h) in hojas.iter().enumerate() {
        println!("  {i}  {}  {}", corto(h), titulo(DOCUMENTOS[i]));
    }
    for (n, nivel) in arbol[1..arbol.len() - 1].iter().enumerate() {
        println!("Nivel {}: {}", n + 1, juntos(nivel));
    }
    println!("Raíz:    {}", hex0x(&raiz(&hojas)));

    // Probar que el documento 4 está en el árbol: bastan sus hermanos, uno por nivel.
    let i = 4;
    let hermanos = prueba(&hojas, i);
    println!("\nPrueba de pertenencia del documento {i} ({}):", titulo(DOCUMENTOS[i]));
    println!("  {} hashes hermanos (log2({}) = {}), {} bytes:", hermanos.len(), hojas.len(), hojas.len().ilog2(), hermanos.len() * 32);
    for (n, h) in hermanos.iter().enumerate() {
        println!("  {}. {}", n + 1, hex0x(h));
    }
    let subida = recalcular(hojas[i], &hermanos);
    println!("Desde la hoja {}, con los {} hermanos se llega a {}", corto(&hojas[i]), hermanos.len(), corto(&subida));
    println!("¿Es la raíz? {}", if subida == raiz(&hojas) { "sí: el documento está en el árbol" } else { "no" });
    println!("Con un millón de documentos (2^20) la prueba tendría {} hashes: {} bytes.", (1u32 << 20).ilog2(), 20 * 32);

    // Mutar una hoja: cambia la raíz, y la prueba vieja ya no lleva a ella.
    let mut mutados: Vec<String> = DOCUMENTOS.iter().map(|d| d.to_string()).collect();
    mutados[1] = mutados[1].replace("nota 5.0", "nota 7.0");
    let hojas_mutadas: Vec<H32> = mutados.iter().map(|d| hoja(d)).collect();
    let raiz_nueva = raiz(&hojas_mutadas);
    println!("\nSe cambia el documento 1: «{}»", mutados[1]);
    println!("Raíz nueva: {}", hex0x(&raiz_nueva));
    println!("¿Cambió la raíz? {}", if raiz_nueva != raiz(&hojas) { "sí" } else { "no" });
    println!("La prueba vieja del documento {i} lleva a {}, no a {}: ya no vale", corto(&recalcular(hojas[i], &hermanos)), corto(&raiz_nueva));
    println!("Prueba nueva del documento {i}: {}", juntos(&prueba(&hojas_mutadas, i)));
    println!("\n✔ Una raíz de 32 bytes resume los 8 documentos; 3 hermanos prueban que uno está dentro.");
}
