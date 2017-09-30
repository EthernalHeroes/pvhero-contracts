pragma solidity ^0.4.13;

import "./Presale.sol";

/**
 * Контракт пресейла заранее созданных токенов, с заранее заданным кол-вом
 */

contract AllocatedCappedPresale is Presale {

    function AllocatedCappedPresale(address _token, address _multisigOrSimpleWallet, uint _start, uint _end, uint _oneTokenInWei) Presale(_token, _multisigOrSimpleWallet, _start, _end, _oneTokenInWei) {
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
        return token.balanceOf(address(this));
    }

    /**
     * Перевод токенов покупателю
     */
    function assignTokens(address receiver, uint tokenAmount) private {
        if (!token.transfer(receiver, tokenAmount)) revert();
    }
}
