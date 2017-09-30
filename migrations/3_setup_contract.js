const Storage = require("../lib/storage.js");
const Converter = require("../lib/converter.js");

const PresaleToken = artifacts.require("./PresaleToken.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");

module.exports = function (deployer, network, accounts) {

    const ownerAddress = Storage.ownerAddress;

    // Создаем начальный пул токенов на адресе контракта продаж
    PresaleToken.deployed().then((instance) => {
        return instance.initialSupply(AllocatedCappedPresale.address, {"from": ownerAddress});
    });

};