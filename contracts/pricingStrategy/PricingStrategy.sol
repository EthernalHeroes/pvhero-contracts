pragma solidity ^0.4.8;

/**
 * Шаблон интерфейса для ценовой стратегии
 */

contract PricingStrategy {

    /** Ценовая стратегия? */
    function isPricingStrategy() public constant returns (bool) {
        return true;
    }

    /**
     * Проверка все ли ок?
     */
    function isSane(address sale) public constant returns (bool) {
        return true;
    }

    /**
       Предпродажная покупки или нет?
       @param purchaser - адрес покупателя
       @return  - False по умолчанию, True - если предпродажная покупка
     */
    function isPresalePurchase(address purchaser) public constant returns (bool) {
        return false;
    }

    /**
     * Вычисляем кол-во токенов, которое можно купить за эфир
     *
     * @param value - кол-во wei в транзакции
     * @param weiRaised - сколько всего заработали wei
     * @param tokensSold - сколько токенов всего продали
     * @param msgSender - инвестор
     * @param decimals - кол-во знаков после ","
     * @return - кол-во токенов, которое получить инвестор
     */
    function calculatePrice(uint value, uint weiRaised, uint tokensSold, address msgSender, uint decimals) public constant returns (uint tokenAmount);
}
