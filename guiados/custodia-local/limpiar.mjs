// Limpieza: borra el estado local del laboratorio. La cadena y el llavero se apagan aparte.
import { borrarEstado } from './lib/estado.mjs';

borrarEstado();
console.log('Estado local borrado (.estado/).');
console.log('Para apagar el resto:');
console.log('  - Cadena:  Ctrl+C en la terminal donde corre anvil');
console.log('  - Llavero: docker rm -f floci');
