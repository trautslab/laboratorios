// Limpieza: borra el estado local (el contrato y las partes de la llave MPC).
import { borrarEstado } from './lib/comun.mjs';

borrarEstado();
console.log('Estado local borrado (.estado/). Para apagar la cadena: Ctrl+C donde corre anvil.');
