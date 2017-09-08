pragma solidity ^0.4.8;

import "./zeppelin/contracts/math/SafeMath.sol";
import "./PricingStrategy.sol";

/**
 * Шаблон фиксированной цены, на всем протяжении продаж применяется только 1 цена
 */

contract FlatPricing is PricingStrategy {

    using SafeMath for uint;

    /* Сколько в wei стоит токен */
    uint public oneTokenInWei;

    function FlatPricing(uint _oneTokenInWei) {
        // Не позволяем установить 0 цену
        require(_oneTokenInWei > 0);

        oneTokenInWei = _oneTokenInWei;
    }

    /**
     * Вычисляем кол-во токенов, которое можно купить за эфир
     *
     */
    function calculatePrice(uint value, uint weiRaised, uint tokensSold, address msgSender, uint decimals) public constant returns (uint) {
        uint multiplier = 10 ** decimals;

        // Проверка, что oneTokenInWei > 0 осуществляется в конструкторе
        return  value.mul(multiplier) / oneTokenInWei;
    }

}
