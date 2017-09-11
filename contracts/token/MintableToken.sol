pragma solidity ^0.4.8;

import "../zeppelin/contracts/math/SafeMath.sol";
import "../zeppelin/contracts/token/ERC20.sol";
import "../zeppelin/contracts/ownership/Ownable.sol";
import '../token/StandardToken.sol';

/**
 * Токен, выпуск которого может быть увеличен посредством другого контракта
 *
 * - Поддержка выпуска налету, без потолка
 * - Только агенты, которых назначил owner могут выпускать новые токены
 *
 */

contract MintableToken is StandardToken, Ownable {

    using SafeMath for uint;

    bool public mintingFinished = false;

    /** Список адресов контрактов агентов, которые могу создавать новые токены */
    mapping (address => bool) public mintAgents;

    event MintingAgentChanged(address addr, bool state);

    /**
     * Создаем новый токен и кидаем его на адрес
     *
     * Вызывается контрактом продаж, как агент
     */
    function mint(address receiver, uint amount) onlyMintAgent canMint public {
        totalSupply = totalSupply.add(amount);
        balances[receiver] = balances[receiver].add(amount);

        // Вызываем событие
        Transfer(0, receiver, amount);
    }

    /**
     * Владелец может разрешить контракту создавать новые токены
     */
    function setMintAgent(address addr, bool state) onlyOwner canMint public {
        mintAgents[addr] = state;

        // Вызываем событие
        MintingAgentChanged(addr, state);
    }

    /* Только контракт продаж может создавать новые токены */
    modifier onlyMintAgent() {
        require(mintAgents[msg.sender]);
        _;
    }

    /** Если выпуск не закончен */
    modifier canMint() {
        require(!mintingFinished);
        _;
    }
}
