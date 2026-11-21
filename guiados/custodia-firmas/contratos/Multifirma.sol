// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// Multifirma didáctica: varios dueños y un umbral de firmas para ejecutar.
/// Existe para poder leerla entera. En producción se usan contratos auditados.
contract Multifirma {
    mapping(address => bool) public esDueno;
    address[] public duenos;
    uint256 public umbral;
    uint256 public nonce; // cada ejecución gasta un número: una firma no sirve dos veces

    event Ejecutada(address indexed destino, uint256 valor, uint256 nonce);

    constructor(address[] memory _duenos, uint256 _umbral) payable {
        require(_umbral > 0 && _umbral <= _duenos.length, "umbral invalido");
        for (uint256 i = 0; i < _duenos.length; i++) esDueno[_duenos[i]] = true;
        duenos = _duenos;
        umbral = _umbral;
    }

    receive() external payable {}

    /// Lo que firman los dueños: la cadena, este contrato, el destino, el monto, los datos y el nonce.
    function huella(address destino, uint256 valor, bytes memory datos, uint256 _nonce) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), destino, valor, keccak256(datos), _nonce));
    }

    /// Cualquiera puede enviar la transacción; lo que cuenta son las firmas que trae.
    function ejecutar(address destino, uint256 valor, bytes calldata datos, bytes[] calldata firmas) external {
        require(firmas.length >= umbral, "faltan firmas");
        bytes32 mensaje = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", huella(destino, valor, datos, nonce)));
        address anterior = address(0);
        for (uint256 i = 0; i < umbral; i++) {
            address firmante = recuperar(mensaje, firmas[i]);
            require(esDueno[firmante], "firmante no es dueno");
            // Las firmas vienen ordenadas por dirección: así la misma no puede contarse dos veces.
            require(firmante > anterior, "firmas repetidas o desordenadas");
            anterior = firmante;
        }
        nonce++;
        (bool ok, ) = destino.call{value: valor}(datos);
        require(ok, "la llamada fallo");
        emit Ejecutada(destino, valor, nonce - 1);
    }

    /// Solo la propia multifirma puede cambiar un dueño: o sea, hace falta el umbral de firmas.
    function cambiarDueno(address viejo, address nuevo) external {
        require(msg.sender == address(this), "solo la propia multifirma");
        require(esDueno[viejo] && !esDueno[nuevo], "cambio invalido");
        esDueno[viejo] = false;
        esDueno[nuevo] = true;
        for (uint256 i = 0; i < duenos.length; i++) if (duenos[i] == viejo) duenos[i] = nuevo;
    }

    function recuperar(bytes32 mensaje, bytes calldata firma) internal pure returns (address) {
        require(firma.length == 65, "firma invalida");
        return ecrecover(mensaje, uint8(firma[64]), bytes32(firma[0:32]), bytes32(firma[32:64]));
    }
}
