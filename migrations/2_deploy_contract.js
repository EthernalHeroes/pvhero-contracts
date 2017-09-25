const Storage = require("../lib/storage.js");
const Converter = require("../lib/converter.js");

// Подключение смарт контрактов
const SafeMath = artifacts.require("./zeppelin/contracts/math/SafeMath.sol");

const PresaleToken = artifacts.require("./token/PresaleToken.sol");
const BonusPricing = artifacts.require("./pricingStrategy/BonusPricing.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");
const DefaultPresaleFinalizeAgent = artifacts.require("./finalizer/DefaultPresaleFinalizeAgent.sol");

module.exports = function (deployer, network, accounts) {

    Storage.setDevMode({
        ownerAddress : accounts[0],
        tokenWalletAddress : accounts[9]
    });

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