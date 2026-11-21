// Paso 2 · Verificar una firma sin tener ninguna llave: recuperar la dirección y compararla.
import { isAddressEqual, recoverMessageAddress } from 'viem';

// Lo que recibe quien verifica: el mensaje y la firma del paso 1. En este archivo no hay llave privada.
const mensaje = 'Recibí el pedido 42';
const firma = '0x49a0332a5c97b6f6494789dde783fc5d99705c7804d52acffc07019b21f5e1b239f457444fa127b4f7462e85ce141ef5cfdeec9b1bd23a288dcffa3c639dd7de1b';
// Lo que ya sabía por otro canal: de quién espera la firma.
const esperada = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Del mensaje y la firma sale la dirección de quien firmó. No se le pregunta a nadie.
const recuperada = await recoverMessageAddress({ message: mensaje, signature: firma });
const coincide = isAddressEqual(recuperada, esperada);
console.log(`Mensaje:              «${mensaje}»`);
console.log(`Firma:                ${firma}`);
console.log(`Dirección recuperada: ${recuperada}`);
console.log(`Dirección esperada:   ${esperada}`);
console.log(`Coinciden:            ${coincide ? 'sí' : 'no'}`);
console.log(coincide ? '\n✔ La firma es de quien tiene la llave de esa dirección. Para comprobarlo no hizo falta ningún secreto.' : '\n✖ La firma no es de la dirección esperada.');
