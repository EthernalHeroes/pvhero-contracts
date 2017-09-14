const Moment = require("moment");

const Storage = require("../lib/storage.js");
const Constant = require("../lib/constant.js");
const Converter = require("../lib/converter.js");

// Подключение смарт контрактов
const SafeMath = artifacts.require("./zeppelin/contracts/math/SafeMath.sol");

const PresaleToken = artifacts.require("./token/PresaleToken.sol");
const BonusPricing = artifacts.require("./pricingStrategy/BonusPricing.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");
const DefaultPresaleFinalizeAgent = artifacts.require("./finalizer/DefaultPresaleFinalizeAgent.sol");

module.exports = function (deployer, network, accounts) {
    Storage.startDate = "2017-09-04 00:00:00";
    Storage.endDate = "2017-09-14 16:00:00";

    const startDate = Storage.startDate;
    const endDate = Storage.endDate;

    // Адрес владельца, по умолчанию Etherbase
    Storage.ownerAddress = accounts[0];
    Storage.beneficiaryAddress = Storage.ownerAddress;

    // Адрес, куда будут переводится платежи за токены
    Storage.tokenWalletAddress = '0x0361B391FaDF8058F2bD206B754aDbDe4118E003';

    // Можно поменять начальное кол-во токенов, которое будет продаваться
    Storage.tokenSymbol = 'PCARD';
    Storage.tokenName = 'Ethernal Heroes Token (Private)';
    Storage.tokenDecimals = 18;
    Storage.isTokenMintable = false;

    // Сколько токенов доступно для продажи
    Storage.tokenTotalSupply = 100 * Constant.MILLION;
    // Разрешаем продавать все токены
    Storage.firstApproveAmount = Storage.tokenTotalSupply;

    Storage.startDateTimestamp = Moment(startDate).unix();
    Storage.endDateTimestamp = Moment(endDate).unix();

    // Стоимость токена в wei
    Storage.oneTokenInWei =  1 * Constant.ETHER / 6000;

    // Описание ценовой стратегии
    Storage.pricingStrategy = [
        // Переводы меньше 15 эфира запрещены, произойдет откат транзакции

        // Перевели от 15, до 50 эфира включительно, получили бонус 25%
        15 * Constant.ETHER, 25 /*%*/,

        // Перевели более 50 эфира, получили бонус 30%
        50 * Constant.ETHER, 30 /*%*/
    ];

    const beneficiaryAddress = Storage.beneficiaryAddress;
    const tokenWalletAddress = Storage.tokenWalletAddress;

    const oneTokenInWei = Storage.oneTokenInWei;
    const symbol = Storage.tokenSymbol;
    const name = Storage.tokenName;
    const decimals = Storage.tokenDecimals;
    const totalSupply  = Storage.tokenTotalSupply;

    const isMintable = Storage.isTokenMintable;

    // Даты начала и окончания продаж
    const startDateTimestamp = Storage.startDateTimestamp;
    const endDateTimestamp = Storage.endDateTimestamp;

    // Деплой

    // Библиотека для безопасных вычислений
    deployer.deploy(SafeMath);

    // Указываем, где она линкуется
    deployer.link(SafeMath, [PresaleToken, BonusPricing, AllocatedCappedPresale]);

    // Контракт ценовой стратегии
    deployer.deploy(BonusPricing, oneTokenInWei, Storage.pricingStrategy).then(() => {

        // Контракт токена
        return deployer.deploy(PresaleToken, name, symbol, Converter.getTokenValue(totalSupply, decimals), decimals, isMintable).then(() => {

            // Контракт для пресейла
            return deployer.deploy(AllocatedCappedPresale, PresaleToken.address, BonusPricing.address, tokenWalletAddress, startDateTimestamp, endDateTimestamp, beneficiaryAddress).then(() => {

                // Контракт финализатора
                return deployer.deploy(DefaultPresaleFinalizeAgent, PresaleToken.address, AllocatedCappedPresale.address);
            });

        });

    });

};