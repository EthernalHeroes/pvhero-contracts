const Constant = require("../lib/constant.js");
const TestUtil = require("../lib/testUtil.js");
const StringUtil = require("string-format");
const Converter = require("../lib/converter.js");
const Storage = require("../lib/storage.js");

const PresaleToken = artifacts.require("./token/PresaleToken.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");

// Состояния из контракта не получается получить
// enum State{Unknown, PreFunding, Funding, Success, Failure, Finalized}
const saleStates = {
    unknown : 0,
    preFunding: 1,
    funding : 2,
    success : 3,
    failure : 4,
    finalized : 5
};

// Преобразование состояния в строку
let salesStateStr = {};
salesStateStr[saleStates.unknown] = 'Unknown';
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

    const promisify = (inner) => new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            };
            resolve(res);
        })
    );

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

    function sendEtherTo(toAccount, fromAccount, wei){
        return new Promise(async (resolve, reject) => {
            web3.eth.sendTransaction({from : fromAccount, to : toAccount, value : wei}, function(err, transactionHash) {
                if (err){
                    resolve(err, null);
                }else{
                    resolve(null, transactionHash);
                };
            });
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

    function sendEtherToAndExpectSuccess(toAccount, fromAccount, wei){
        return sendEtherTo(toAccount, fromAccount, wei).then(function(err , success) {
            assert.equal(err, null, 'При переводе эфира на другой аккаунт не должно возникать ошибки');
        });
    };

    async function checkSendEtherTo(toAccount, fromAccount, wei){
        await sendEtherToAndExpectSuccess(toAccount, fromAccount, wei);
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
        let ownerBalanceBeforeCall = await token.balanceOf.call(AllocatedCappedPresale.address);
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

        let ownerBalanceAfterCall = await token.balanceOf.call(AllocatedCappedPresale.address);
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

    async function getBalance(accountAddress, at){
        return promisify(cb => web3.eth.getBalance(accountAddress, at, cb));
    };

    // Начало теста
    it('Служебный вызов, перевод 20 эфира с адреса accounts[5] на accounts[3]', async function() {
        let balanceBeforeCall = await getBalance(accounts[3]);
        let balanceBefore =  balanceBeforeCall.valueOf();
        await checkSendEtherTo(accounts[3], accounts[5], web3.toWei(20, 'ether'));

        let balanceAfterCall = await getBalance(accounts[3]);
        let balanceAfter = balanceAfterCall.valueOf();

        let balanceMustBe = parseInt(balanceBefore) + parseInt(web3.toWei(20, 'ether'));

        assert.equal(balanceAfter, balanceMustBe, 'Баланс account[3] должен быть пополнен');
    });

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

    it('Наименование токена, символ, кол-во знаков, и тип токена должны быть заданы корректно', async function() {
        let symbolCall = await token.symbol.call();
        assert.equal(symbolCall.valueOf(), Storage.tokenSymbol, 'Символ токена в контракте не совпадает со значением, которое задано в настройках');

        let nameCall = await token.name.call();
        assert.equal(nameCall.valueOf(), Storage.tokenName, 'Имя токена в контракте не совпадает со значением, которое задано в настройках');

        let decimalsCall = await token.decimals.call();
        assert.equal(decimalsCall.valueOf(), Storage.tokenDecimals, 'Кол-во знаков в контракте не совпадает со значением, которое задано в настройках');
    });

    it('Кошелек для сбора средств должен быть задан корректно', async function(){
        await checkPresaleState(saleStates.preFunding);
    });

    it('Начальное состояние контракта продаж, для тестируемых значений должно быть PreFunding', async function(){
        await checkPresaleState(saleStates.preFunding);
    });

    it('На балансе контракта AllocatedCappedPresale, должно находится {0} токенов'.format(Storage.tokenTotalSupply), async function(){
        let tokensLeftCall = await presale.getTokensLeft.call();
        let tokensLeft = tokensLeftCall.valueOf();

        // Можем продавать все токены сразу
        assert.equal(tokensLeft, Converter.getTokenValue(Storage.tokenTotalSupply, Storage.tokenDecimals), 'Количество токенов на балансе контракта не совпадает со значением, которое задано в настройках ');
    });

    it("Переводы в состоянии Prefund не должны работать", async function() {
        await checkContractFallbackWithError(accounts[1], presale);
    });

    // Проверка fallback для отгруженных контрактов, транзакции проходить не должны
    it("Fallback перевод на контракт PresaleToken должен возвращать ошибку", async function() {
        await checkContractFallbackWithError(accounts[1], token);
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
        let sendingEtherValueInWei = web3.toWei(15, 'ether');

        let balanceBefore = await getBalance(accounts[1]);

        await checkSendEtherAndGetBonus(accounts[1], sendingEtherValueInWei, 0.25);

        let balanceAfter = await getBalance(accounts[1]);

        let gasAmount = balanceBefore - balanceAfter - sendingEtherValueInWei;

        console.log('Стоимость использованного газа: {0} wei'.format(gasAmount));
    });

    it("В состоянии Funding, перевод 49 эфира - бонус 25%, проверка корректности получения и списания токенов", async function() {
        await checkSendEtherAndGetBonus(accounts[1], web3.toWei(49, 'ether'), 0.25);
    });

    it("В состоянии Funding, перевод 50 эфира - бонус 30%, проверка корректности получения и списания токенов", async function() {
        await checkSendEtherAndGetBonus(accounts[2], web3.toWei(50, 'ether'), 0.3);
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

    it("В состоянии Funding, перевод 100 эфира - бонус 35%, проверка корректности получения и списания токенов", async function() {
        await checkSendEtherAndGetBonus(accounts[3], web3.toWei(100, 'ether'), 0.35);
    });

    // Финальный перевод, покупаем все оставшиеся токены
    it("В состоянии Funding, финальный перевод, проверка корректности получения и списания токенов", async function() {
        let tokensLeftCall = await presale.getTokensLeft.call();
        let tokensLeft = tokensLeftCall.valueOf() / Converter.getTokenValue(1, 18);

        await checkSendEtherAndGetBonus(accounts[4], tokensLeft * Storage.oneTokenInWei / (1 + 0.25), 0.25);
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
        await checkNotAcceptEther(accounts[4], presale, web3.toWei(16, 'ether'));
    });

});
