pragma solidity ^0.4.13;

import "../zeppelin/contracts/token/StandardToken.sol";
import "../zeppelin/contracts/ownership/Ownable.sol";

/**
 * Токен предпродаж
 *
 * ERC-20 токен, для пресейла
 *
 * - Контракт токена дает возможность опционально перейти на новый контракт
 * - Токен может быть с верхним лимитом или без него
 *
 */

contract PresaleToken is StandardToken, Ownable {

    /* Описание см. в конструкторе */
    string public name;

    string public symbol;

    uint public decimals;

    bool public isInitialSupplied = false;

    /** Событие обновления токена (имя и символ) */
    event UpdatedTokenInformation(string newName, string newSymbol);

    /**
     * Конструктор
     *
     * Токен должен быть создан только владельцем через кошелек (либо с мультиподписью, либо без нее)
     *
     * @param _name - имя токена
     * @param _symbol - символ токена
     * @param _initialSupply - со сколькими токенами мы стартуем
     * @param _decimals - кол-во знаков после запятой
     */
    function PresaleToken(string _name, string _symbol, uint _initialSupply, uint _decimals) {
        owner = msg.sender;

        name = _name;
        symbol = _symbol;

        totalSupply = _initialSupply;

        decimals = _decimals;

        //Обязательное требование, чтобы токены имели начальное кол-во
        require(totalSupply != 0);
    }

    /**
     * Владелец должен вызвать эту функцию, чтобы присвоить начальный баланс
     */
    function initialSupply(address _toAddress) onlyOwner {
        require(!isInitialSupplied);

        // Создаем начальный баланс токенов на кошельке
        balances[_toAddress] = totalSupply;

        isInitialSupplied = true;
    }

    /**
     * Владелец может обновить инфу по токену
     */
    function setTokenInformation(string _name, string _symbol) onlyOwner {
        name = _name;
        symbol = _symbol;

        // Вызываем событие
        UpdatedTokenInformation(name, symbol);
    }


}
