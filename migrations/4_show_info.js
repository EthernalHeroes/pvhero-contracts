const Storage = require("../lib/storage.js");
const Colors = require("colors");
const Util = require("util");
const StringUtil = require("../lib/stringUtil.js");

const PresaleToken = artifacts.require("./token/PresaleToken.sol");
const BonusPricing = artifacts.require("./pricingStrategy/BonusPricing.sol");
const AllocatedCappedPresale = artifacts.require("./AllocatedCappedPresale.sol");
const DefaultPresaleFinalizeAgent = artifacts.require("./finalizer/DefaultPresaleFinalizeAgent.sol");

module.exports = function (deployer, network, accounts) {

    // Вывод общей информации
    DefaultPresaleFinalizeAgent.deployed().then(()=>{

        console.log(StringUtil.newLine());
        console.log(StringUtil.newLine());

        console.log(Colors.bold.yellow("Successfully deployed"));

        console.log(StringUtil.newLine());

        console.log(Util.format("AllocatedCappedPresale address: %s", Colors.green(AllocatedCappedPresale.address)));
        console.log(Util.format("PresaleToken address: %s", Colors.green(PresaleToken.address)));
        console.log(Util.format("BonusPricing address: %s", Colors.green(BonusPricing.address)));
        console.log(Util.format("DefaultPresaleFinalizeAgent address: %s", Colors.green(DefaultPresaleFinalizeAgent.address)));

        console.log(StringUtil.newLine());

        console.log(Colors.yellow("Please check common info!!!"));
        console.log(StringUtil.newLine());
        console.log(Util.format("ownerAddress: %s", Colors.green(Storage.ownerAddress)));
        console.log(Util.format("beneficiaryAddress: %s", Colors.green(Storage.beneficiaryAddress)));
        console.log(Util.format("tokenWalletAddress: %s", Colors.bold.green(Storage.tokenWalletAddress)));

        console.log(StringUtil.newLine());

        console.log(Util.format("oneTokenInWei: %s", Colors.green(Storage.oneTokenInWei)));

        console.log(StringUtil.newLine());

        console.log(Util.format("symbol: %s", Colors.bold.green(Storage.tokenSymbol)));
        console.log(Util.format("name: %s", Colors.bold.green(Storage.tokenName)));
        console.log(Util.format("decimals: %s", Colors.green(Storage.tokenDecimals)));
        console.log(Util.format("totalSupply: %s", Colors.bold.green(Storage.tokenTotalSupply)));

        console.log(StringUtil.newLine());

        if (Storage.isTokenMintable){
            console.log(Colors.bold.yellow("Warning, token is mintable!!!"));
        }else{
            console.log("Token is not mintable");
        };

        console.log(StringUtil.newLine());

        console.log(Util.format("startDate: %s", Colors.green(Storage.startDate)));
        console.log(Util.format("endDate: %s", Colors.green(Storage.endDate)));

        console.log(StringUtil.newLine());
        console.log(StringUtil.newLine());
    });

};