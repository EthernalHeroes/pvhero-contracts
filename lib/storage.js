const Moment = require("moment");
const Constant = require("../lib/constant.js");

var storage = {
    setProdMode : function(opts){
        // Нужно заполнить!!!
        this.ownerAddress = '';
        // Адрес, куда будут переводится платежи за токены
        this.tokenWalletAddress = '';

        this.startDate = "2017-09-30 10:00:00";
        this.endDate = "2017-10-10 10:00:00";


        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'PMAGE';
        this.tokenName = 'Ethernal Heroes Token (Private)';
        this.tokenDecimals = 18;

        // Стоимость токена в wei
        this.oneTokenInWei =  1 * Constant.ETHER / 6000;

        // Сколько токенов доступно для продажи
        this.tokenTotalSupply = 160 * Constant.MILLION;

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