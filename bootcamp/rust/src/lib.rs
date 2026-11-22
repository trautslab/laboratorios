//! Lo que comparten los pasos: los ocho documentos y el árbol de Merkle (igual que lib/comun.mjs).
use sha3::{Digest, Keccak256};

pub type H32 = [u8; 32];

/// Ocho certificados de un curso. Son el «documento» de todos los pasos.
pub const DOCUMENTOS: [&str; 8] = [
    "Certificado 0041 · Ana Rojas · nota 6.5 · aprobado",
    "Certificado 0042 · Beto Díaz · nota 5.0 · aprobado",
    "Certificado 0043 · Carla Soto · nota 6.1 · aprobado",
    "Certificado 0044 · Diego Paz · nota 4.8 · aprobado",
    "Certificado 0045 · Elena Ruiz · nota 6.9 · aprobado",
    "Certificado 0046 · Fabio Gil · nota 5.7 · aprobado",
    "Certificado 0047 · Gina Vega · nota 4.2 · aprobado",
    "Certificado 0048 · Hugo Lara · nota 5.3 · aprobado",
];

pub fn hex0x(bytes: &[u8]) -> String {
    format!("0x{}", hex::encode(bytes))
}
pub fn corto(bytes: &[u8]) -> String {
    let h = hex::encode(bytes);
    format!("0x{}…{}", &h[..6], &h[h.len() - 4..])
}

pub fn keccak(datos: &[u8]) -> H32 {
    Keccak256::digest(datos).into()
}

/// La huella de un documento es su Keccak-256. La hoja del árbol es el hash de la huella:
/// así lo que entra al árbol mide siempre 32 bytes y nunca se confunde con un par de nodos (64 bytes).
pub fn huella(texto: &str) -> H32 {
    keccak(texto.as_bytes())
}
pub fn hoja(texto: &str) -> H32 {
    keccak(&huella(texto))
}

/// Un nodo es el hash de sus dos hijos, el menor primero (como MerkleProof de OpenZeppelin).
pub fn par(a: &H32, b: &H32) -> H32 {
    let (x, y) = if a < b { (a, b) } else { (b, a) };
    keccak(&[x.as_slice(), y.as_slice()].concat())
}

/// Todos los niveles, de las hojas a la raíz. Este laboratorio usa 2, 4 u 8 hojas (potencias de 2).
pub fn niveles(hojas: &[H32]) -> Vec<Vec<H32>> {
    let mut todos = vec![hojas.to_vec()];
    while todos.last().unwrap().len() > 1 {
        let arriba = todos.last().unwrap().chunks(2).map(|p| par(&p[0], &p[1])).collect();
        todos.push(arriba);
    }
    todos
}
pub fn raiz(hojas: &[H32]) -> H32 {
    niveles(hojas).last().unwrap()[0]
}

/// La prueba de la hoja i: en cada nivel, el hermano de quien va subiendo.
pub fn prueba(hojas: &[H32], mut i: usize) -> Vec<H32> {
    let todos = niveles(hojas);
    let mut hermanos = vec![];
    for nivel in &todos[..todos.len() - 1] {
        hermanos.push(nivel[i ^ 1]);
        i /= 2;
    }
    hermanos
}

/// Verificar es subir desde la hoja con los hermanos y comparar con la raíz.
pub fn recalcular(hoja_inicial: H32, hermanos: &[H32]) -> H32 {
    hermanos.iter().fold(hoja_inicial, |actual, hermano| par(&actual, hermano))
}
