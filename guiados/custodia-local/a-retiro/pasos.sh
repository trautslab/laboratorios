# Orden de ejecución del laboratorio A. Lo usa capturar-evidencia.sh.
ANA=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
correr 01-cadena node a-retiro/01-cadena.mjs
correr 02-llavero node a-retiro/02-llavero.mjs
correr 03-crear-llave node a-retiro/03-crear-llave.mjs
correr 04-direccion node a-retiro/04-direccion.mjs
correr 05-depositar node a-retiro/05-depositar.mjs
correr 06-politica-aprobada node a-retiro/06-politica.mjs "$ANA" 0.5
correr 06-politica-rechazada node a-retiro/06-politica.mjs "$ANA" 5
correr 07-firmar node a-retiro/07-firmar.mjs "$ANA" 0.5
correr 08-enviar node a-retiro/08-enviar.mjs
correr 09-fallos node a-retiro/09-fallos.mjs
correr 10-registro node a-retiro/10-registro.mjs
