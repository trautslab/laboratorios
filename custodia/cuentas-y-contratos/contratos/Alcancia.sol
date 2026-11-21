// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Una alcancía mínima: recibe ETH al crearse y no hace nada más.
// Solo sirve para tener en la cadena una dirección con código.
contract Alcancia {
    constructor() payable {}
}
