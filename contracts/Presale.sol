pragma solidity ^0.4.13;

import "./Haltable.sol";
import "./token/FractionalERC20.sol";
import "./math/SafeMath.sol";

/**
 * Базовый контракт для пресейла
 */

/* Продажи могут быть остановлены в любой момент по вызову halt() */

contract Presale is Haltable, SafeMath {
    /* Токен, который продаем */
    FractionalERC20 public token;

    /* Токены будут выдаваться с этого адреса */
    address public multisigOrSimpleWallet;

    /* Стоимость 1 токена в wei*/
    uint public oneTokenInWei;

    /* Старт продаж в формате UNIX timestamp */
    uint public startsAt;

    /* Конец продаж в формате UNIX timestamp */
    uint public endsAt;

    /* Кол-во проданных токенов*/
    uint public tokensSold = 0;

    /* Сколько wei мы получили 10^18 wei = 1 ether */
    uint public weiRaised = 0;

    /* Кол-во уникальных адресов, которые у наc получили токены */
    uint public investorCount = 0;

    /* Флаг нормального завершнения пресейла */
    bool public finalized;

    /** Мапа, адрес инвестора - кол-во эфира */
    mapping (address => uint256) public investedAmountOf;

    /** Мапа адрес инвестора - кол-во выданных токенов */
    mapping (address => uint256) public tokenAmountOf;

    /** Возможные состояния
     *
     * - Prefunding: Префандинг, еще не задали дату окончания
     * - Funding: Продажи
     * - Success: Достигли условия завершения
     * - Failure: Что-то пошло не так, продажи не завершились успешно
     * - Finalized: Сработал финализатор
     */
    enum State{Unknown, PreFunding, Funding, Success, Failure, Finalized}

    // Событие покупки токена
    event Invested(address investor, uint weiAmount, uint tokenAmount);

    // Событие изменения даты окончания пресейла
    event EndsAtChanged(uint newEndsAt);

    // Конструктор
    function Presale(address _token, address _multisigOrSimpleWallet, uint _start, uint _end, uint _oneTokenInWei) {

        owner = msg.sender;

        // Токен, который поддерживает дробную часть
        // На самом деле, все хранится в uint
        token = FractionalERC20(_token);

        oneTokenInWei = _oneTokenInWei;

        multisigOrSimpleWallet = _multisigOrSimpleWallet;
        require(multisigOrSimpleWallet != 0);

        // Проверяем, что дата начала не = 0
        require(_start != 0);

        startsAt = _start;

        // Проверяем, что дата окончания не = 0
        require(_end != 0);

        endsAt = _end;

        // Проверяем дату окончания
        require(startsAt < endsAt);
    }

    /**
     * Fallback функция вызывающаяся при переводе эфира
     */
    function() payable {
        buy();
    }

    /**
     * Инвестиции
     *
     * Должен быть включен режим продаж
     *
     * @param receiver - эфирный адрес получателя
     *
     */
    function investInternal(address receiver) stopInEmergency private {
        require(getState() == State.Funding);

        uint weiAmount = msg.value;

        // Ценовая стратегия

        // Получаем стоимость продажи токенов исходя из стратегии
        uint tokenAmount = 0;

        uint multiplier = 10 ** token.decimals();

        uint bonusPercentage = 0;

        // бонус 0%
        if (weiAmount >= 0.05 ether && weiAmount < 15 ether){
            bonusPercentage = 0;
        } else if (weiAmount >= 15 ether && weiAmount < 50 ether){
            bonusPercentage = 25;
        // бонус 30%
        } else if (weiAmount >= 50 ether && weiAmount < 100 ether){
            bonusPercentage = 30;
         // бонус 35%
        } else if (weiAmount >= 100 ether){
            bonusPercentage = 35;
        } else {
            revert();
        }

        uint resultValue = safeMul(weiAmount, multiplier) / oneTokenInWei;
        tokenAmount = safeMul(resultValue, 100 + bonusPercentage) / 100;
        //

        require(tokenAmount != 0);

        // Новый инвестор?
        if (investedAmountOf[receiver] == 0) {
            investorCount++;
        }

        // Обновляем стату
        updateStat(receiver, weiAmount, tokenAmount);

        // Проверяем не достигли ли мы потолка
        require(!isBreakingCap(weiAmount, tokenAmount, weiRaised, tokensSold));

        // Переводим токены инвестору или выпускаем новые токены, в зависимости от того, что за токен
        assignTokens(receiver, tokenAmount);

        // Шлем на кошелёк эфир
        if (!multisigOrSimpleWallet.send(weiAmount)) revert();

        // Вызываем событие
        Invested(receiver, weiAmount, tokenAmount);
    }

    // Обновляем стату
    function updateStat(address receiver, uint weiAmount, uint tokenAmount) private {
        weiRaised = safeAdd(weiRaised, weiAmount);
        tokensSold = safeAdd(tokensSold, tokenAmount);

        investedAmountOf[receiver] = safeAdd(investedAmountOf[receiver], weiAmount);
        tokenAmountOf[receiver] = safeAdd(tokenAmountOf[receiver], tokenAmount);
    }

    /**
     * Спец. функция, которая позволяет продавать токены вне ценовой политики, доступка только владельцу
     * @param receiver - получатель
     * @param fullTokens - общее кол-во токенов, кол-во знаков добавляется внутри
     * @param weiPrice - цена в wei
     *
     */
    function preallocate(address receiver, uint fullTokens, uint weiPrice) public onlyOwner {
        uint tokenAmount = safeMul(fullTokens, 10 ** token.decimals());

        // Может быть 0, выдаем токены бесплатно
        uint weiAmount = weiPrice * fullTokens;

        // Обновляем стату
        updateStat(receiver, weiAmount, tokenAmount);

        // Переводим токены инвестору или выпускаем новые токены в зависимости от типа токена
        assignTokens(receiver, tokenAmount);

        // Вызываем событие
        Invested(receiver, weiAmount, tokenAmount);
    }

    /**
     * Покупка токенов, кидаем токены на адрес отправителя
     */
    function buy() public payable {
        investInternal(msg.sender);
    }

    /**
     * Финализатор успешного пресейла
     */
    function finalize() public inState(State.Success) onlyOwner stopInEmergency {

        // Продажи должны быть не завершены
        require(!finalized);

        finalized = true;
    }

    /**
     * Позволяет менять владельцу дату окончания
     */
    function setEndsAt(uint time) onlyOwner {

        // Не даем менять прошлое
        require(now <= time);

        endsAt = time;

        // Вызываем событие
        EndsAtChanged(endsAt);
    }

    /**
     * Владелец может поменять адрес кошелька для сбора средств
     */
    function setMultisigOrSimpleWallet(address addr) public onlyOwner {
        multisigOrSimpleWallet = addr;
    }

    /**
     * Получаем стейт
     *
     * Не пишем в переменную, чтобы не было возможности поменять извне, только вызов функции может отразить текущее состояние
     */
    function getState() public constant returns (State) {
        if (finalized) return State.Finalized;
        else if (block.timestamp < startsAt) return State.PreFunding;
        else if (block.timestamp <= endsAt && !isPresaleFull()) return State.Funding;
        else if (isPresaleFull()) return State.Success;
        else return State.Failure;
    }

    /**
    * Модификаторы
    */

    /** Только, если текущее состояние соответсвует состоянию  */
    modifier inState(State state) {
        require(getState() == state);
        _;
    }

    /**
    * Абстрактные функции
    */

    /**
     * Проверка на достижение потолка
     *
     *
     * Потомки должны переопределить свои правила
     *
     * @param weiAmount - кол-во wei, которое нам переводят
     * @param tokenAmount - кол-во токенов, которое мы пытаемся выдать
     * @param weiRaisedTotal - общее заработанное кол-во в wei
     * @param tokensSoldTotal - общее кол-во проданных токенов
     *
     * @return true - если принятие средств превышает потолок
     */
    function isBreakingCap(uint weiAmount, uint tokenAmount, uint weiRaisedTotal, uint tokensSoldTotal) constant returns (bool limitBroken);

    /**
     * Проверка на то, что все токены проданы
     */
    function isPresaleFull() public constant returns (bool);

    /**
     * Создать новый токен и перевести или просто перевести инвестору, в зависимости от типа токена
     */
    function assignTokens(address receiver, uint tokenAmount) private;
}
