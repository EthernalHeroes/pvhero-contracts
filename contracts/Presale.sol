pragma solidity ^0.4.8;

import "./zeppelin/contracts/math/SafeMath.sol";
import "./Haltable.sol";
import "./PricingStrategy.sol";
import "./FinalizeAgent.sol";
import "./FractionalERC20.sol";

/**
 * Базовый контракт для пресейла
 *
 * Содержит
 * - Дата начала и конца
 * - Различные стратегии цен
 */

/* Продажи могут быть остановлены в любой момент по вызову halt() */

contract Presale is Haltable {

    using SafeMath for uint;

    /* Токен, который продаем */
    FractionalERC20 public token;

    /* Ценовая стратегия */
    PricingStrategy public pricingStrategy;

    /* Финализатор */
    FinalizeAgent public finalizeAgent;

    /* Токены будут выдаваться с этого адреса */
    address public multisigOrSimpleWallet;

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
     * - Preparing: Все контракты инициализированы, но переменные еще не установлены
     * - Prefunding: Префандинг, еще не задали дату окончания
     * - Funding: Продажи
     * - Success: Достигли условия завершения
     * - Failure: Что-то пошло не так, продажи не завершились успешно
     * - Finalized: Сработал финализатор
     */
    enum State{Unknown, Preparing, PreFunding, Funding, Success, Failure, Finalized}

    // Событие покупки токена
    event Invested(address investor, uint weiAmount, uint tokenAmount, uint128 customerId);

    // Событие изменения даты окончания пресейла
    event EndsAtChanged(uint newEndsAt);

    // Конструктор
    function Presale(address _token, PricingStrategy _pricingStrategy, address _multisigOrSimpleWallet, uint _start, uint _end) {

        owner = msg.sender;

        // Токен, который поддерживает дробную часть
        // На самом деле, все хранится в uint
        token = FractionalERC20(_token);

        setPricingStrategy(_pricingStrategy);

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
     * @param customerId - опционально передается customerId, чтобы можно было трекать успешные продажи на серверной стороне
     *
     */
    function investInternal(address receiver, uint128 customerId) stopInEmergency private {

        // Если стейт - Prefunding, не принимаем инвестиции
        if (getState() == State.PreFunding) {
            revert();
        }else if (getState() == State.Funding) {
            // Участники могут инвестировать только в режиме продаж
        }else {
            // В любом другом случае не принимаем инвестиции
            revert();
        }

        uint weiAmount = msg.value;

        // Получаем стоимость продажи токенов исходя из стратегии
        uint tokenAmount = pricingStrategy.calculatePrice(weiAmount, weiRaised, tokensSold, msg.sender, token.decimals());

        // Цена = 0, выходим
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
        Invested(receiver, weiAmount, tokenAmount, customerId);
    }

    // Обновляем стату
    function updateStat(address receiver, uint weiAmount, uint tokenAmount){
        weiRaised = weiRaised.add(weiAmount);
        tokensSold = tokensSold.add(tokenAmount);

        investedAmountOf[receiver] = investedAmountOf[receiver].add(weiAmount);
        tokenAmountOf[receiver] = tokenAmountOf[receiver].add(tokenAmount);
    }

    /**
     * Спец. функция, которая позволяет продавать токены вне ценовой политики, доступка только владельцу
     * @param receiver - получатель
     * @param fullTokens - общее кол-во токенов, кол-во знаков добавляется внутри
     * @param weiPrice - цена в wei
     *
     */
    function preallocate(address receiver, uint fullTokens, uint weiPrice) public onlyOwner {
        uint tokenAmount = fullTokens.mul(10 ** token.decimals());

        // Может быть 0, выдаем токены бесплатно
        uint weiAmount = weiPrice * fullTokens;

        // Обновляем стату
        updateStat(receiver, weiAmount, tokenAmount);

        // Переводим токены инвестору или выпускаем новые токены в зависимости от типа токена
        assignTokens(receiver, tokenAmount);

        // Вызываем событие
        Invested(receiver, weiAmount, tokenAmount, 0);
    }

    /**
     * Также поддерживаем анонимные платежи, без customerId
     */
    function invest(address addr) public payable {
        investInternal(addr, 0);
    }

    /**
     * Покупка токенов, кидаем токены на адрес отправителя
     */
    function buy() public payable {
        invest(msg.sender);
    }

    /**
     * Финализатор успешного пресейла
     */
    function finalize() public inState(State.Success) onlyOwner stopInEmergency {

        // Продажи должны быть не завершены
        require(!finalized);

        // Финализатор - опционален, вызываем его только в случае, если он доступен
        if (address(finalizeAgent) != 0) {
            finalizeAgent.finalize();
        }

        finalized = true;
    }

    /**
     * Можем переустановить финализатор
     *
     * Установить можно без проверки стейта
     */
    function setFinalizeAgent(FinalizeAgent addr) onlyOwner {
        finalizeAgent = addr;

        // Если это финализатор
        require(finalizeAgent.isFinalizeAgent());
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
     * Только владелец можем изменить ценовую стратегию
     */
    function setPricingStrategy(PricingStrategy _pricingStrategy) onlyOwner {
        pricingStrategy = _pricingStrategy;

        // Не позволяем установить пустуб стратегию
        require(pricingStrategy.isPricingStrategy());
    }

    /**
     * Владелец может поменять адрес кошелька для сбора средств
     */
    function setMultisigOrSimpleWallet(address addr) public onlyOwner {
        multisigOrSimpleWallet = addr;
    }

    /**
     * Проверка все ли хорошо с контрактом (финализатор)
     */
    function isFinalizerSane() public constant returns (bool sane) {
        return finalizeAgent.isSane();
    }

    /**
     * Проверка все ли хорошо с контрактом (ценовая стратегия)
     */
    function isPricingSane() public constant returns (bool sane) {
        return pricingStrategy.isSane(address(this));
    }

    /**
     * Получаем стейт
     *
     * Не пишем в переменную, чтобы не было возможности поменять извне, только вызов функции может отразить текущее состояние
     */
    function getState() public constant returns (State) {
        if (finalized) return State.Finalized;
        else if (address(finalizeAgent) == 0) return State.Preparing;
        else if (!finalizeAgent.isSane()) return State.Preparing;
        else if (!pricingStrategy.isSane(address(this))) return State.Preparing;
        else if (block.timestamp < startsAt) return State.PreFunding;
        else if (block.timestamp <= endsAt && !isPresaleFull()) return State.Funding;
        else if (isPresaleFull()) return State.Success;
        else return State.Failure;
    }

    /** Спец маркер для проверки в других классах */
    function isPresale() public constant returns (bool) {
        return true;
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
