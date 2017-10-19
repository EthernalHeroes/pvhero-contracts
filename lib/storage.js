const Moment = require("moment");
const Constant = require("../lib/constant.js");

var storage = {
    setProdMode : function(opts){
        // Нужно заполнить!!!
        this.ownerAddress = '0xa165950EfE0Bce322AbB1Fe9FF3Bf16a73628D04';
        // Адрес, куда будут переводится платежи за токены
        this.tokenWalletAddress = '0xA63E6911093a4ea28F92C0E0A2b2e9E54640cED3';

        this.startDate = "2017-10-09 00:00:00";
        this.endDate = "2017-12-31 23:59:59";


        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'PMAGE';
        this.tokenName = 'Ethernal Heroes Token (Private)';
        this.tokenDecimals = 18;

        // Стоимость токена в wei
        this.oneTokenInWei =  1 * Constant.ETHER / 6000;

        // Сколько токенов доступно для продажи
        this.tokenTotalSupply = 5 * Constant.MILLION;

        this.startDateTimestamp = Moment(this.startDate).unix();
        this.endDateTimestamp = Moment(this.endDate).unix();
    },

    setDevMode : function(opts){
        opts.ownerAddress = opts.ownerAddress || '0x0';
        this.ownerAddress = opts.ownerAddress;

        // Адрес, куда будут переводится платежи за токены
        this.tokenWalletAddress = opts.tokenWalletAddress || '0x0';

        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'PMAGE';
        this.tokenName = 'Ethernal Heroes Token (Private)';
        this.tokenDecimals = 18;

        // Стоимость токена в wei
        this.oneTokenInWei =  1 * Constant.ETHER;

        // Сколько токенов доступно для продажи
        this.tokenTotalSupply = 300;

        this.startDateTimestamp = Moment().add(1, "days").unix();
        this.endDateTimestamp = Moment().add(5, "days").unix();

        this.startDate = Moment.unix(this.startDateTimestamp).format("YYYY-MM-DD HH:mm:ss");
        this.endDate = Moment.unix(this.endDateTimestamp).format("YYYY-MM-DD HH:mm:ss");
    }
};

module.exports = storage;