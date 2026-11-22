// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Registro} from "../src/Registro.sol";

/// Las tres cheatcodes que usa la prueba. Forge las atiende en esta dirección fija
/// (keccak256("hevm cheat code")); así no hace falta instalar forge-std.
interface Vm {
    function prank(address quien) external;
    function roll(uint256 bloque) external;
    function expectRevert(bytes calldata datos) external;
}

contract RegistroTest {
    Vm constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);
    Registro registro;
    address constant ANA = address(0xA11CE);

    // Valores del paso 2 (node 2-merkle.mjs): la raíz de los 8 certificados, la hoja del documento 4 y su prueba.
    bytes32 constant RAIZ = 0x710c0310f64ac567fb899d01da2e47084874b281821edef84bd990a9bb61a403;
    bytes32 constant HOJA_4 = 0x32e0255caaede8015a0369935884f7d32941a68ef91821a424fcdf860e8b354b;
    // La hoja del documento 4 con la nota cambiada de 6.9 a 7.9.
    bytes32 constant HOJA_4_ALTERADA = 0x9192970280466773d9dda72928a46708d3ffa2dc3476995e2199cb9a0f09aa1a;

    function prueba4() internal pure returns (bytes32[] memory p) {
        p = new bytes32[](3);
        p[0] = 0xd7e693f5f82bbf70e013a97a075334f611a5e51492712071e732539ce68b397c;
        p[1] = 0x09450aadc014e13545fe003bf9b867237223a734779c78fc18b1e5515a540036;
        p[2] = 0x2e64d914e3e36e48aefcbe68252bc117149d8c1e934572a4ba13b42786e531b7;
    }

    function setUp() public {
        registro = new Registro();
    }

    function test_GuardaQuienYEnQueBloque() public {
        vm.roll(7);
        vm.prank(ANA);
        registro.registrar(RAIZ);
        (address quien, uint64 bloque) = registro.entradas(RAIZ);
        require(quien == ANA, "quien no es Ana");
        require(bloque == 7, "bloque no es 7");
    }

    function test_NoSeRegistraDosVeces() public {
        vm.roll(7);
        vm.prank(ANA);
        registro.registrar(RAIZ);
        vm.expectRevert(abi.encodeWithSelector(Registro.YaRegistrada.selector, RAIZ, ANA, uint64(7)));
        registro.registrar(RAIZ);
    }

    function test_VerificaLaPruebaDelPaso2() public {
        registro.registrar(RAIZ);
        require(registro.verificar(HOJA_4, prueba4(), RAIZ), "la prueba valida no paso");
    }

    function test_RechazaUnaHojaAlterada() public {
        registro.registrar(RAIZ);
        require(!registro.verificar(HOJA_4_ALTERADA, prueba4(), RAIZ), "acepto una hoja alterada");
    }

    function test_RechazaUnaRaizNoRegistrada() public view {
        require(!registro.verificar(HOJA_4, prueba4(), RAIZ), "acepto una raiz sin registrar");
    }
}
