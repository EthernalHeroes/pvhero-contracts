const Storage = require("../lib/storage.js");
const Converter = require("../lib/converter.js");

// Подключение смарт контрактов
const SafeMath = artifacts.require("./zeppelin/contracts/math/SafeMath.sol");

const PresaleToken = artifacts.require("./token/PresaleToken.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");

module.exports = function (deployer, network, accounts) {

    // Storage.setDevMode({
    //     ownerAddress : accounts[0],
    //     tokenWalletAddress : accounts[9]
    // });

    Storage.setProdMode();

    const tokenWalletAddress = Storage.tokenWalletAddress;

    const symbol = Storage.tokenSymbol;
    const name = Storage.tokenName;
    const decimals = Storage.tokenDecimals;
    const totalSupply = Storage.tokenTotalSupply;
    const oneTokenInWei = Storage.oneTokenInWei;

    // Даты начала и окончания продаж
    const startDateTimestamp = Storage.startDateTimestamp;
    const endDateTimestamp = Storage.endDateTimestamp;

    // Деплой
    // Контракт токена
    return deployer.deploy(PresaleToken, name, symbol, Converter.getTokenValue(totalSupply, decimals), decimals).then(() => {
        // Контракт для пресейла
        return deployer.deploy(AllocatedCappedPresale, PresaleToken.address, tokenWalletAddress, startDateTimestamp, endDateTimestamp, oneTokenInWei);
    });

};