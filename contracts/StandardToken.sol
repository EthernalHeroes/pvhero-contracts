pragma solidity ^0.4.8;

import "./zeppelin/contracts/math/SafeMath.sol";
import './zeppelin/contracts/token/ERC20.sol';

/**
 * Стандарт ERC20
 *
 * - Основан на коде FirstBlood:
 * - https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */

contract StandardToken is ERC20 {

    using SafeMath for uint;

    /* Событие выпуска токена и передача новому владельцу  */
    event Minted(address receiver, uint amount);

    /* Балансы инвесторов в токенах */
    mapping (address => uint) balances;

    /* Мапа с approve() */
    mapping (address => mapping (address => uint)) allowed;

    /* Флаг того, что это токен */
    function isToken() public constant returns (bool weAre) {
        return true;
    }

    /* Перевод _value токенов к _to*/
    function transfer(address _to, uint _value) returns (bool success) {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);

        //Вызываем событие
        Transfer(msg.sender, _to, _value);

        return true;
    }

    /* Описание тут: https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/edit */
    /* Перевод от _from к _to в кол-ве _value */
    function transferFrom(address _from, address _to, uint _value) returns (bool success) {
        uint _allowance = allowed[_from][msg.sender];

        balances[_to] = balances[_to].add(_value);
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = _allowance.sub(_value);

        //Вызываем событие
        Transfer(_from, _to, _value);

        return true;
    }

    /* Метод позволяет получить баланс токенов для заданного _owner'а */
    function balanceOf(address _owner) constant returns (uint balance) {
        return balances[_owner];
    }

    /* Описание тут: https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/edit */

    /* approve() находится в стандарте ERC20, в данном случае реализация в StandardToken.sol, используется для разрешения продаж определенного кол-ва токенов */
    /* Например, выпустили 1000 токенов, после этого нужно сделать approve() на то кол-во, которое разрешаем продавить */
    function approve(address _spender, uint _value) returns (bool success) {

        // https://github.com/nimiq-network/nimiq-exchange-token/commit/3f0f9599bfe66a1371a57dab59fe080f0f56ab14
        // При изменении утвержденной суммы, сначала нужно установить ее в "0"
        // и подождать пока транзакция завершится, только после этого устанавливаем новое значение
        // иначе можем подвергнуться атаке, см: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

        // Используем revert вместо require для читабельности
        if ((_value != 0) && (allowed[msg.sender][_spender] != 0)) revert();

        allowed[msg.sender][_spender] = _value;

        // Вызываем событие
        Approval(msg.sender, _spender, _value);

        return true;
    }

    /* Кол-во токенов, которое _spender может снять у _owner'а */
    function allowance(address _owner, address _spender) constant returns (uint remaining) {
        return allowed[_owner][_spender];
    }

}
