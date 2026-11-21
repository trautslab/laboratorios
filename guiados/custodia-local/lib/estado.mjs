// Estado del laboratorio entre un paso y el siguiente: un archivo JSON en .estado/.
// En un custodio real esto sería una base de datos; aquí basta un archivo que puedes abrir y leer.
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.estado');
const archivo = (nombre) => path.join(carpeta, nombre);

export function leer(nombre, porDefecto = {}) {
  return existsSync(archivo(nombre)) ? JSON.parse(readFileSync(archivo(nombre), 'utf8')) : porDefecto;
}

export function guardar(nombre, datos) {
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(archivo(nombre), `${JSON.stringify(datos, null, 2)}\n`);
}

// Registro de auditoría: una línea JSON por decisión, solo se agrega al final.
export function anotar(evento) {
  mkdirSync(carpeta, { recursive: true });
  appendFileSync(archivo('registro.jsonl'), `${JSON.stringify(evento)}\n`);
}

export function leerRegistro() {
  if (!existsSync(archivo('registro.jsonl'))) return [];
  return readFileSync(archivo('registro.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((linea) => JSON.parse(linea));
}

export function borrarEstado() {
  rmSync(carpeta, { recursive: true, force: true });
}

// Atajo: la llave del paso 3. Si falta, el mensaje dice qué paso correr.
export function llaveCaliente() {
  const { llaveCaliente: llave } = leer('llaves.json');
  if (!llave?.keyId) throw new Error('Falta la llave. Corre antes: node a-retiro/03-crear-llave.mjs');
  if (!llave.address) throw new Error('Falta la dirección. Corre antes: node a-retiro/04-direccion.mjs');
  return llave;
}

// Laboratorio B: las carteras de la tesorería (depósitos, hot y warm).
export function carteras() {
  const { tesoreria } = leer('llaves.json');
  if (!tesoreria) throw new Error('Faltan las carteras. Corre antes: node b-tesoreria/01-carteras.mjs');
  return tesoreria;
}

// Suma lo que el custodio paga en comisiones de red, para poder conciliar al final.
export function sumarComision(wei) {
  const cuentas = leer('cuentas.json', { comisionesWei: '0', capitalPropioWei: '0' });
  guardar('cuentas.json', { ...cuentas, comisionesWei: (BigInt(cuentas.comisionesWei) + wei).toString() });
}
