// Ayudas para imprimir en la terminal de forma pareja.
export const titulo = (texto) => console.log(`\n== ${texto} ==`);
export const dato = (etiqueta, valor) => console.log(`${`${etiqueta}:`.padEnd(25)} ${valor}`);
export const nota = (texto) => console.log(`   ${texto}`);
export const listo = (texto) => console.log(`\n✔ ${texto}`);
export const corto = (hex, inicio = 10, fin = 8) => (hex.length > inicio + fin + 1 ? `${hex.slice(0, inicio)}…${hex.slice(-fin)}` : hex);

// Un error esperado se muestra limpio; uno inesperado conserva el detalle.
export function terminar(error) {
  console.error(`\n✖ ${error.message}`);
  process.exit(1);
}
