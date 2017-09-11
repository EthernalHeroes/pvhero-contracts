pragma solidity ^0.4.8;

import "../zeppelin/contracts/math/SafeMath.sol";
import "../pricingStrategy/PricingStrategy.sol";

/**
 * Шаблон цены c бонусами
 * - Бонусы зависят от переводимой суммы в эфире
 */

contract BonusPricing is PricingStrategy {

    using SafeMath for uint;

    // Всего может быть 10 элементов
    uint public constant MAX_ITEMS = 10;

    /**
    * Структура распарсенных элементов
    */
    struct Item {
        // Сумма в wei, когда начинает действовать правило
        uint amount;
        // Скидка в %
        uint discountPercentage;
    }

    /**
    * Храним данные в массиве с фиксированной длиной, чтобы его можно было видеть в blockchain explorer
    * Динамические массивы пока не поддерживаются
    * Пока не реализована поддержка задания длины массива через константу используем двойное описание длины:
    * 1 - в константе MAX_ITEMS
    * 2 - в переменной tranches */

    //todo: Переделать на динамический массив, когда в blockchain explorer их можно будет посмотреть
    Item[10] public items;

    // Сколько элементов передано
    uint public itemCount;

    /* Сколько в wei стоит токен */
    uint public oneTokenInWei;

    /** Создаем список элементов
    * @param _items uint[] - пары элементов, каждая пара состоит из (amount, price)
    */
    function BonusPricing(uint _oneTokenInWei, uint[] _items) {
        // Не позволяем установить 0 цену
        require(_oneTokenInWei > 0);

        oneTokenInWei = _oneTokenInWei;

        // Проверяем корректность входных данных
        if (_items.length % 2 == 1 || _items.length >= MAX_ITEMS * 2) revert();

        itemCount = _items.length / 2;

        uint highestAmount = 0;

        for(uint i = 0; i < _items.length / 2; i++) {
            items[i].amount = _items[i * 2];
            items[i].discountPercentage = _items[i * 2 + 1];

            // Проверка на валидность
            if((highestAmount != 0) && (items[i].amount <= highestAmount)) {
                revert();
            }

            highestAmount = items[i].amount;
        }

    }

    /**
    * Все ли ок?
    */

    function isSane(address _presale) public constant returns(bool) {
        return true;
    }

    /**
    * Получаем подходящий элемент, если не найден, откатываем транзакцию
    */
    function getItemForAmount(uint weiValue) private constant returns (Item) {
        uint i;

        for(i = 0; i < itemCount; i++) {

            // Если интервал справа не найден, то считаем, что просто больше текущей цены
            if (i + 1 >= itemCount){

                if(weiValue > items[i].amount) {
                    return items[i];
                }

            }else{
                // Если есть интервал справа, то считаем, что цена должна попадать в диапазон от текущего, до следующего элемента включительно

                if(weiValue >= items[i].amount && weiValue <= items[i + 1].amount) {
                    return items[i];
                }
            }

        }

        // Ни одно условие не сработало
        revert();
    }

    /**
    * Вычисляем стоимость 1 токена в wei с учетом ценовой политики
    */

    function getOneTokenInWeiWithBonus(uint weiValue) public constant returns (uint result) {

        uint discountPercentage = getItemForAmount(weiValue).discountPercentage;

        // Вычисляем цену 1 токена в wei с учетом скидки
        uint oneTokenInWeiWithBonus = oneTokenInWei.mul(100 - discountPercentage) / 100;

        return oneTokenInWeiWithBonus;
    }

    /**
     * Вычисляем кол-во токенов, которое можно купить за эфир
     *
     */
    function calculatePrice(uint value, uint weiRaised, uint tokensSold, address msgSender, uint decimals) public constant returns (uint) {

        uint multiplier = 10 ** decimals;

        // В случае, если нет подходящего условия, откатываем транзакцию
        uint oneTokenInWeiWithBonus = getOneTokenInWeiWithBonus(value);

        return value.mul(multiplier) / oneTokenInWeiWithBonus;
    }

    // Контракт не принимает платежи
    function() payable {
        revert();
    }

}
