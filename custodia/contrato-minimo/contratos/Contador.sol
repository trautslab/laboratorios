// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Un contador: guarda un número en la cadena y deja que cualquiera le sume.
contract Contador {
    uint256 public valor;

    function sumar(uint256 cuanto) external {
        valor += cuanto;
    }
}
