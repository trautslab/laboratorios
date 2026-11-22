// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// Registro de raíces de Merkle: quién registró cada raíz y en qué bloque.
/// Verificar que un documento está en un lote es comprobar su prueba contra una raíz registrada.
contract Registro {
    struct Entrada {
        address quien; // 20 bytes
        uint64 bloque; // 8 bytes: cabe con la dirección en una sola casilla de 32
    }

    mapping(bytes32 raiz => Entrada) public entradas;

    event Registrada(bytes32 indexed raiz, address indexed quien, uint64 bloque);

    error YaRegistrada(bytes32 raiz, address quien, uint64 bloque);

    /// Guarda la raíz una sola vez. No se puede sobrescribir ni borrar.
    function registrar(bytes32 raiz) external {
        Entrada memory previa = entradas[raiz];
        if (previa.quien != address(0)) revert YaRegistrada(raiz, previa.quien, previa.bloque);
        entradas[raiz] = Entrada(msg.sender, uint64(block.number));
        emit Registrada(raiz, msg.sender, uint64(block.number));
    }

    /// Verdadero si la raíz está registrada y la prueba lleva de la hoja a esa raíz.
    /// La prueba son los hashes hermanos, de abajo hacia arriba (pares ordenados, como en el paso 2).
    function verificar(bytes32 hoja, bytes32[] calldata prueba, bytes32 raiz) external view returns (bool) {
        return entradas[raiz].quien != address(0) && MerkleProof.verifyCalldata(prueba, raiz, hoja);
    }
}
