// Paso 5 · Registrar la raíz del paso 2 en el contrato y verificar pruebas en la cadena.
use alloy::primitives::{address, Address, FixedBytes};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::sol;
use bootcamp::{corto, hex0x, hoja, prueba, raiz, H32, DOCUMENTOS};

// El artefacto que escribe `forge build`: ABI y bytecode del contrato.
sol!(#[sol(rpc)] Registro, "../contratos/out/Registro.sol/Registro.json");

const DESPLEGO: Address = address!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // cuenta de prueba 0 de Anvil: corrió forge create
const QUIEN: Address = address!("70997970C51812dc3A010C7d01b50e0d17dc79C8"); // cuenta de prueba 1: registra la raíz

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let cadena = ProviderBuilder::new().connect_http("http://127.0.0.1:8545".parse()?);
    let direccion = DESPLEGO.create(0); // primer contrato de la cuenta 0
    let registro = Registro::new(direccion, &cadena);

    let hojas: Vec<H32> = DOCUMENTOS.iter().map(|d| hoja(d)).collect();
    let raiz_ = FixedBytes::from(raiz(&hojas));
    let prueba_: Vec<FixedBytes<32>> = prueba(&hojas, 4).into_iter().map(FixedBytes::from).collect();

    match cadena.get_code_at(direccion).await {
        Ok(codigo) if !codigo.is_empty() => {}
        _ => {
            eprintln!("✖ No hay contrato en {direccion}. Con Anvil recién arrancado, corre el forge create de este paso.");
            std::process::exit(1);
        }
    }
    println!("Registro en {direccion} (bloque {}: el despliegue de forge create)", cadena.get_block_number().await?);

    // Registrar es una escritura: una transacción de la cuenta 1, que queda anotada como «quien».
    let recibo = registro.registrar(raiz_).from(QUIEN).send().await?.get_receipt().await?;
    let bloque_tx = recibo.block_number.unwrap_or(0);
    println!("\nregistrar({}) desde la cuenta 1: status {} · bloque {bloque_tx} · gas usado {}", corto(raiz_.as_slice()), u8::from(recibo.status()), recibo.gas_used);
    let entrada = registro.entradas(raiz_).call().await?;
    println!("entradas(raíz): quien {} · bloque {}", entrada.quien, entrada.bloque);

    // El límite de gas es por bloque: cuánto trabajo cabe en él. Este es el de la Anvil local, no el de mainnet.
    let limite = cadena.get_block_by_number(bloque_tx.into()).await?.expect("el bloque existe").header.gas_limit;
    println!("Límite de gas del bloque {bloque_tx} en esta Anvil: {limite} → registrar usa el {:.3} %", (recibo.gas_used as f64 / limite as f64) * 100.0);

    // Verificar es una lectura (eth_call): corre en el nodo, no crea bloque ni cuesta comisión.
    let alterada = FixedBytes::from(hoja(&DOCUMENTOS[4].replace("6.9", "7.9")));
    let mutados: Vec<H32> = DOCUMENTOS.iter().enumerate().map(|(i, d)| if i == 1 { hoja(&d.replace("nota 5.0", "nota 7.0")) } else { hoja(d) }).collect();
    let no_registrada = FixedBytes::from(raiz(&mutados));
    let h4 = FixedBytes::from(hojas[4]);
    println!("\nverificar(hoja del documento 4, prueba de {} hashes, raíz):  {}", prueba_.len(), registro.verificar(h4, prueba_.clone(), raiz_).call().await?);
    println!("verificar(hoja alterada 6.9 → 7.9, misma prueba, raíz): {}", registro.verificar(alterada, prueba_.clone(), raiz_).call().await?);
    println!("verificar(hoja 4, misma prueba, raíz {}… no registrada): {}", &hex0x(no_registrada.as_slice())[..8], registro.verificar(h4, prueba_.clone(), no_registrada).call().await?);
    println!("Bloque después de verificar: {} (leer no crea bloques)", cadena.get_block_number().await?);

    // Registrar la misma raíz otra vez: el contrato lo rechaza con su error, y dice quién y cuándo la registró.
    match registro.registrar(raiz_).from(DESPLEGO).call().await {
        Ok(_) => println!("\nregistrar otra vez: aceptado (no debería)"),
        Err(e) => {
            let error = e.as_decoded_error::<Registro::YaRegistrada>().expect("el contrato revierte con YaRegistrada");
            println!("\nregistrar la misma raíz otra vez: revierte con YaRegistrada({}…, {}, {})", &hex0x(error.raiz.as_slice())[..8], error.quien, error.bloque);
        }
    }
    println!("\n✔ La raíz quedó en la cadena con quién y en qué bloque; el contrato verifica la prueba del documento 4.");
    Ok(())
}
