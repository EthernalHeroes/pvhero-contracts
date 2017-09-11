pragma solidity ^0.4.8;

import '../token/StandardToken.sol';
import "../token/MintableToken.sol";

/**
 * Токен предпродаж
 *
 * ERC-20 токен, для пресейла
 *
 * - Контракт токена дает возможность опционально перейти на новый контракт
 * - Токен может быть с верхним лимитом или без него, контракт может выпускать новые токены (задается параметром _mintable в конструкторе)
 *
 */

contract PresaleToken is MintableToken {

    /* Описание см. в конструкторе */
    string public name;

    string public symbol;

    uint public decimals;

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
     * @param _mintable - токен генерится через продажи или прочто через заданное кол-во?
     */
    function PresaleToken(string _name, string _symbol, uint _initialSupply, uint _decimals, bool _mintable) {
        owner = msg.sender;

        name = _name;
        symbol = _symbol;

        totalSupply = _initialSupply;

        decimals = _decimals;

        // Создаем начальный баланс токенов на кошельке
        balances[owner] = totalSupply;

        if (totalSupply > 0) {
            // Вызываем событие
            Minted(owner, totalSupply);
        }

        // Если токены выпускаются сразу, то считаем, что выпуск токенов больше невозможен
        if (!_mintable) {
            mintingFinished = true;

            //Обязательное требование, чтобы токены были mintable или имели начальное кол-во
            require(totalSupply != 0);
        }
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
