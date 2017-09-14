const Storage = require("../lib/storage.js");
const Converter = require("../lib/converter.js");

const PresaleToken = artifacts.require("./PresaleToken.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");
const DefaultPresaleFinalizeAgent = artifacts.require("./DefaultPresaleFinalizeAgent.sol");

module.exports = function (deployer, network, accounts) {

    const ownerAddress = Storage.ownerAddress;

    // Устанавливаем финализатор
    AllocatedCappedPresale.deployed().then((instance) => {
        return instance.setFinalizeAgent(DefaultPresaleFinalizeAgent.address, {from : ownerAddress});
    });

    // Разрешаем продавать токены
    PresaleToken.deployed().then((instance) => {
        return instance.approve(AllocatedCappedPresale.address, Converter.getTokenValue(Storage.firstApproveAmount, Storage.tokenDecimals), {"from": ownerAddress});
    });

};