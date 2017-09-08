pragma solidity ^0.4.8;

import "./Presale.sol";

/**
 * Контракт пресейла заранее созданных токенов, с заранее заданным кол-вом
 */

contract AllocatedCappedPresale is Presale {

    /* Адрес владельца, от имени кого будут передаваться токены инвестору */
    address public beneficiary;

    // uint - алиас для uint256 (см. http://solidity.readthedocs.io/en/develop/types.html)
    // _token - адрес контракта токена
    // _pricingStrategy - адрес контракта ценовой стратегии
    // _multisigOrSimpleWallet - адрес либо мультиподписного кошелька, либо обычного, куда будут поступать платежи
    // _start - старт продаж Unix timestamp в секундах
    // _end - окончание продаж Unix timestamp в секундах
    // _beneficiary - адрес, от имени кого будут передаваться токены инвестору

    function AllocatedCappedPresale(address _token, PricingStrategy _pricingStrategy, address _multisigOrSimpleWallet, uint _start, uint _end, address _beneficiary) Presale(_token, _pricingStrategy, _multisigOrSimpleWallet, _start, _end) {
        beneficiary = _beneficiary;
    }

    /**
     * Проверяет достингут ли потолок продажи токенов
     * Вызывается из родительского понтракта Presale метод invest(), служит для проверки достижения потолка токенов
     * tokenAmount - сколько токенов пытаемся выдать
     */
    function isBreakingCap(uint weiAmount, uint tokenAmount, uint weiRaisedTotal, uint tokensSoldTotal) constant returns (bool limitBroken) {
        if (tokenAmount > getTokensLeft()) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Все распродано?
     * Когда кол-во оставшихся токенов = 0 - все распродано
     */
    function isPresaleFull() public constant returns (bool) {
        return getTokensLeft() == 0;
    }

    /**
     * Возвращает кол-во нераспроданных токенов
     */
    function getTokensLeft() public constant returns (uint) {
        // Кол-во токенов, которое адрес контракта можеть снять у owner'а и есть кол-во оставшихся токенов
        return token.allowance(owner, this);
    }

    /**
     * Перевод токенов с approve() пула покупателю
     * approve() описан в стандарте ERC20, в данном случае реализация в StandardToken.sol, используется для разрешения продаж определенного кол-ва токенов
     * Например, выпустили 1000 токенов, после этого нужно сделать approve() на то кол-во, которое разрешаем продавать
     */
    function assignTokens(address receiver, uint tokenAmount) private {
        // Если перевод не удался, откатываем транзакцию
        if (!token.transferFrom(beneficiary, receiver, tokenAmount)) revert();
    }
}
