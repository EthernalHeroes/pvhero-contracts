const Constant = require("../lib/constant.js");
const TestUtil = require("../lib/testUtil.js");
const StringUtil = require("string-format");
const Converter = require("../lib/converter.js");
const Storage = require("../lib/storage.js");

const PresaleToken = artifacts.require("./token/PresaleToken.sol");
const BonusPricing = artifacts.require("./pricingStrategy/BonusPricing.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");
const DefaultPresaleFinalizeAgent = artifacts.require("./finalizer/DefaultPresaleFinalizeAgent.sol");

// Состояния из контракта не получается получить
// enum State{Unknown, Preparing, PreFunding, Funding, Success, Failure, Finalized}
const saleStates = {
    unknown : 0,
    preparing : 1,
    preFunding: 2,
    funding : 3,
    success : 4,
    failure : 5,
    finalized : 6
};

// Преобразование состояния в строку
let salesStateStr = {};
salesStateStr[saleStates.unknown] = 'Unknown';
salesStateStr[saleStates.preparing] = 'Preparing';
salesStateStr[saleStates.preFunding] = 'PreFunding';
salesStateStr[saleStates.funding] = 'Funding';
salesStateStr[saleStates.success] = 'Success';
salesStateStr[saleStates.failure ] = 'Failure';
salesStateStr[saleStates.finalized] = 'Finalized';

// Подключаем форматирование строк
StringUtil.extend(String.prototype);

it("Запуск", function(){
});

contract('AllocatedCappedPresale', async function(accounts) {
    let token = await PresaleToken.deployed();
    let presale = await AllocatedCappedPresale.deployed();
    let bonusPricing = await BonusPricing.deployed();
    let finalizeAgent = await DefaultPresaleFinalizeAgent.deployed();

    function getNotOwnerAccountAddress(){
        let result = null;

        for(let account in accounts){
            if (account != Storage.ownerAddress){
                return account;
            };
        };

        return result;
    };

    function checkFloatValuesEquality(val1, val2, epsilon){
        epsilon = epsilon || 0.001;
        return Math.abs(val1 - val2) <= epsilon;
    };

    function sendEther(fromAccount, contractInstance, wei){
        // На всех аккаунтах по 100 эфира, 0 аккаунт - владелец
        // Пробуем перевести 1 эфир на контракт токена, с 1 - го аккаунта
        return new Promise(async (resolve, reject) => {
            try{

                let result = await contractInstance.sendTransaction({from: fromAccount, value : wei});

                resolve(null, result);

            }catch(ex){

                resolve(ex, null);

            };
        });
    };

    function callHalt(fromAccount){
        return new Promise(async (resolve, reject) => {

            try{
                await presale.halt({from: fromAccount});

                resolve(null, true);
            }catch(ex){
                resolve(ex, null);
            };
        });
    };

    function callHaltAndExpectError(fromAccount){
        return callHalt(fromAccount).then((err, success) => {
            assert.notEqual(err, null, 'Вызов halt() не владельцем должен возвращать ошибку');
        });
    };

    function callHaltAndExpectSuccess(fromAccount){
        return callHalt(fromAccount).then((err, success) => {
            assert.equal(err, null, 'Вызов halt() допускается только владельцем');
        });
    };

    function callUnhalt(fromAccount){
        return new Promise(async (resolve, reject) => {

            try{
                await presale.unhalt({from: fromAccount});

                resolve(null, true);
            }catch(ex){
                resolve(ex, null);
            };
        });
    };

    function callUnhaltAndExpectError(fromAccount){
        return callUnhalt(fromAccount).then((err, success) => {
            assert.notEqual(err, null, 'Вызов unhalt() не владельцем должен возвращать ошибку');
        });
    };

    function callUnhaltAndExpectSuccess(fromAccount){
        return callUnhalt(fromAccount).then((err, success) => {
            assert.equal(err, null, 'Вызов unhalt() допускается только владельцем');
        });
    };

    function sendEtherAndExpectError(fromAccount, contractAddress, wei){
        // На всех аккаунтах по 100 эфира, 0 аккаунт - владелец
        // Пробуем перевести 1 эфир на контракт токена, с 1 - го аккаунта
        return sendEther(fromAccount, contractAddress, wei).then((err , success) => {
            assert.notEqual(err, null, 'При переводе эфира на контракт должна возникать ошибка');
        });
    };

    function sendEtherAndExpectSuccess(fromAccount, contractInstance, wei){
        // На всех аккаунтах по 100 эфира, 0 аккаунт - владелец
        // Пробуем перевести 1 эфир на контракт токена, с 1 - го аккаунта
        return sendEther(fromAccount, contractInstance, wei).then(function(err , success) {
            assert.equal(err, null, 'При переводе эфира на контракт не должно возникать ошибки');
        });
    };

    async function checkNotAcceptEther(fromAccount, contractAddress, wei){
        await sendEtherAndExpectError(fromAccount, contractAddress, wei);
    };

    async function checkContractFallbackWithError(accountFrom, contractInstance){
        await sendEtherAndExpectError(accountFrom, contractInstance, web3.toWei(1, 'ether'));
    };

    async function checkPresaleState(expectedState){
        let currentState = await presale.getState.call();
        assert.equal(currentState.valueOf(), expectedState, 'Cостояние должно быть {0}, текущее состояние: {1}'.format(salesStateStr[expectedState], salesStateStr[currentState.valueOf()]));
    };

    async function checkAccountTokenBalance(account, expectedValue){
        let balanceCall = await token.balanceOf.call(account);
        assert.equal(balanceCall.valueOf(), expectedValue, 'Значение баланса аккаунта: {0} ({1}), не соответствует значению: {2}'.format(account, balanceCall.valueOf(), expectedValue));
    };

    async function checkSendEtherAndGetBonus(fromAccount, wei, expectedBonus){
        // Баланс токенов на счете владельца
        let ownerBalanceBeforeCall = await token.balanceOf.call(Storage.ownerAddress);
        let ownerBalanceBefore = ownerBalanceBeforeCall.valueOf();

        // Баланс токенов на счете плательщика
        let payerBalanceBeforeCall = await token.balanceOf.call(fromAccount);
        let payerBalanceBefore = payerBalanceBeforeCall.valueOf();

        await sendEtherAndExpectSuccess(fromAccount, presale, wei);

        let payerBalanceAfterCall = await token.balanceOf.call(fromAccount);
        let payerBalanceAfter = payerBalanceAfterCall.valueOf();

        let tokensWithoutBonus = wei / Storage.oneTokenInWei;
        let tokensWithBonus = tokensWithoutBonus * (1 + expectedBonus);

        let payerDeltaBalance = (payerBalanceAfter - payerBalanceBefore) / Storage.oneTokenInWei;

        assert.equal(checkFloatValuesEquality(payerDeltaBalance, tokensWithBonus), true, 'Должен быть начислен бонус {0}%'.format(expectedBonus * 100));

        let ownerBalanceAfterCall = await token.balanceOf.call(Storage.ownerAddress);
        let ownerBalanceAfter = ownerBalanceAfterCall.valueOf();

        // Кол-во токенов на аккаунте владельца должно уменьшиться
        let ownerDeltaBalance = (ownerBalanceBefore - ownerBalanceAfter) / Storage.oneTokenInWei;

        assert.equal(checkFloatValuesEquality(ownerDeltaBalance, tokensWithBonus), true, 'Со счета владельца должны быть списаны токены');
    };

    async function checkContractOwner(contractInstance, contractName, expectedOwner){
        let ownerCall = await contractInstance.owner.call();
        assert.equal(ownerCall.valueOf(), expectedOwner, 'Владелец в контракте {0}, не совпадает со значением, которое задано в настройках'.format(contractName));
    };

    async function checkContractHalt(expectedValue){
        let haltedCall = await presale.halted.call();
        assert.equal(haltedCall.valueOf(), expectedValue, 'Значение переменной halted в контракте продаж должно быть установлено в {0}'.format(expectedValue?'true':'false'));
    };

    // Начало теста

    it('Владелец контрактов должен быть задан корректно', async function() {
        await checkContractOwner(token, 'PresaleToken', Storage.ownerAddress);
        await checkContractOwner(presale, 'AllocatedCappedPresale', Storage.ownerAddress);
    });

    it('Даты начала и окончания должны быть заданы корректно', async function() {
        let startDateCall = await presale.startsAt.call();
        assert.equal(startDateCall.valueOf(), Storage.startDateTimestamp, 'Дата старта в контракте не совпадает с датой, которая задана в настройках');

        let endDateCall = await presale.endsAt.call();
        assert.equal(endDateCall.valueOf(), Storage.endDateTimestamp, 'Дата окончания в контракте не совпадает с датой, которая задана в настройках');
    });

    it('Агент - финализатор должен быть задан корректно', async function() {
        let finalizeAgentCall = await presale.finalizeAgent.call();
        assert.equal(finalizeAgentCall.valueOf(), DefaultPresaleFinalizeAgent.address, 'Агент - финализатор задан некорректно');
    });

    it('Наименование токена, символ, кол-во знаков, и тип токена должны быть заданы корректно', async function() {
        let symbolCall = await token.symbol.call();
        assert.equal(symbolCall.valueOf(), Storage.tokenSymbol, 'Символ токена в контракте не совпадает со значением, которое задано в настройках');

        let nameCall = await token.name.call();
        assert.equal(nameCall.valueOf(), Storage.tokenName, 'Имя токена в контракте не совпадает со значением, которое задано в настройках');

        let decimalsCall = await token.decimals.call();
        assert.equal(decimalsCall.valueOf(), Storage.tokenDecimals, 'Кол-во знаков в контракте не совпадает со значением, которое задано в настройках');

        let mintingFinishedCall = await token.mintingFinished.call();
        assert.equal(mintingFinishedCall.valueOf(), !Storage.isTokenMintable, 'Токен не должен чеканиться налету');
    });

    it('Кошелек для сбора средств должен быть задан корректно', async function(){
        await checkPresaleState(saleStates.preFunding);
    });

    it('Начальное состояние контракта продаж, для тестируемых значений должно быть PreFunding', async function(){
        await checkPresaleState(saleStates.preFunding);
    });

    it('Продаем сразу все токены без ограничений в количестве: {0}'.format(Storage.tokenTotalSupply), async function(){
        // Можем продавать все токены сразу
        assert.equal(Storage.tokenTotalSupply, Storage.firstApproveAmount, 'Количество выпушенных токенов не соответствует разрешенному к продаже значению');
    });

    it("Изначально должно быть выпущено: {0} токенов, для аккаунта: {1}".format(Storage.firstApproveAmount, Storage.beneficiaryAddress), async function() {
        await checkAccountTokenBalance(Storage.beneficiaryAddress, Converter.getTokenValue(Storage.firstApproveAmount, Storage.tokenDecimals));
    });

    it("Переводы в состоянии Prefund не должны работать", async function() {
        await checkContractFallbackWithError(accounts[1], presale);
    });

    // Проверка fallback для отгруженных контрактов, транзакции проходить не должны
    it("Fallback переводы на все отгруженные контракты, кроме AllocatedCappedPresale должны возвращать ошибку", async function() {
        await checkContractFallbackWithError(accounts[1], presale);
        await checkContractFallbackWithError(accounts[1], bonusPricing);
        await checkContractFallbackWithError(accounts[1], finalizeAgent);
    });

    // 2 дня после старта, будет период продаж
    it("Перевели время на 2 дня вперед", async function() {
        await TestUtil.increaseTime(2 * Constant.DAY);
    });

    it('Состояние, после изменения времени на 2 дня вперед, должно быть Funding', async function(){
        await checkPresaleState(saleStates.funding);
    });

    // Проверка ценовой стратегии
    // При переводе меньше 15 эфира - должна возвращаться ошибка
    it("В состоянии Funding переводы меньше 15 эфира - запрещены", async function() {
        await checkNotAcceptEther(accounts[1], presale, web3.toWei(14, 'ether'))
        await checkNotAcceptEther(accounts[1], presale, web3.toWei(14.9, 'ether'));
    });

    // При переводе от 15, до 50 включительно - бонус 25%
    it("В состоянии Funding, перевод 15 эфира - бонус 25%, проверка корректности получения и списания токенов", async function() {
        await checkSendEtherAndGetBonus(accounts[1], web3.toWei(15, 'ether'), 0.25);
    });

    it("В состоянии Funding, перевод 50 эфира - бонус 25%, проверка корректности получения и списания токенов", async function() {
        await checkSendEtherAndGetBonus(accounts[1], web3.toWei(50, 'ether'), 0.25);
    });

    // Остановка торгов
    it("Остановить торги может только владелец", async function() {
        // Берем произвольный аккаунт не являющийся владельцем
        await callHaltAndExpectError(getNotOwnerAccountAddress());
        await callHaltAndExpectSuccess(Storage.ownerAddress);
    });

    it('После вызовы halt(), у контракта продаж, переменная halted, должна быть установлена в true', async function(){
        await checkContractHalt(true);
    });

    it("После экстренной остановки продаж, переводы эфира на контракт не должны работать", async function() {
        await checkNotAcceptEther(accounts[2], presale, web3.toWei(20, 'ether'));
    });

    it("Возобновить торги может только владелец", async function() {
        // Берем произвольный аккаунт не являющийся владельцем
        await callUnhaltAndExpectError(getNotOwnerAccountAddress());
        await callUnhaltAndExpectSuccess(Storage.ownerAddress);
    });

    it('После вызовы unhalt(), у контракта продаж, переменная halted, должна быть установлена в false', async function(){
        await checkContractHalt(false);
    });

    it("В состоянии Funding, перевод 51 эфира - бонус 30%, проверка корректности получения и списания токенов", async function() {
        await checkSendEtherAndGetBonus(accounts[2], web3.toWei(51, 'ether'), 0.3);
    });

    // Финальный перевод, покупаем все оставшиеся токены
    it("В состоянии Funding, финальный перевод, проверка корректности получения и списания токенов", async function() {
        let tokensLeftCall = await presale.getTokensLeft.call();
        let tokensLeft = tokensLeftCall.valueOf() / Converter.getTokenValue(1, 18);

        await checkSendEtherAndGetBonus(accounts[3], tokensLeft * Storage.oneTokenInWei / (1 + 0.25), 0.25);
    });

    // Проверка финализации
    it("Проверка корректного завершения торгов", async function() {
        // Проверка финализации
        let isPresaleFullCall = await presale.isPresaleFull.call();
        assert.equal(isPresaleFullCall.valueOf(), true, 'Продажи должны быть завершены');

        let currentStateCall = await presale.getState.call();
        assert.equal(currentStateCall.valueOf(), saleStates.success, 'Конечное состояние для dev режима должно быть Success');
    });

    // После успеха, платежи не принимаются
    it("Перевели время на 7 дней вперед", async function() {
        await TestUtil.increaseTime(7 * Constant.DAY);
    });

    it('Состояние, после изменения времени на 7 дней вперед от текущего, должно быть Success', async function(){
        await checkPresaleState(saleStates.success);
    });

    it("После окончания продаж, переводы - запрещены", async function() {
        await checkNotAcceptEther(accounts[2], presale, web3.toWei(16, 'ether'));
    });

});
