pragma solidity ^0.4.8;

import "../Presale.sol";
import "../token/PresaleToken.sol";

/**
 * Стандартный финализатор, который передается в контракт пресейла
 */

contract DefaultPresaleFinalizeAgent is FinalizeAgent {

    PresaleToken public token;
    Presale public presale;

    function DefaultPresaleFinalizeAgent(PresaleToken _token, Presale _presale) {
        token = _token;
        presale = _presale;
    }

    /** Проверяем все ли хорошо */
    function isSane() public constant returns (bool) {
        return true;
    }

    /** Вызывается 1 раз в пресейле (finalize()) если продажи прошли успешно */
    function finalize() public {
    }

}
