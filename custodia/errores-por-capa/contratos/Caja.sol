// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Una caja con tope. Existe solo para provocar un fallo dentro de un contrato.
contract Caja {
    uint256 public retirado;

    // Anota el retiro y después comprueba el tope. Si no pasa, revierte: lo anotado se deshace.
    function retirar(uint256 monto) external {
        retirado += monto;
        require(retirado <= 100, "Caja: el tope es 100");
    }
}
