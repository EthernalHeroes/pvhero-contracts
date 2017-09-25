const Moment = require("moment");
const Constant = require("../lib/constant.js");

var storage = {
    setProdMode : function(opts){
        opts.ownerAddress = opts.ownerAddress || '0x0';
        this.ownerAddress = opts.ownerAddress;
        this.beneficiaryAddress = this.ownerAddress;

        this.startDate = "дата начала";
        this.endDate = "дата конца";

        // Адрес, куда будут переводится платежи за токены
        this.tokenWalletAddress = 'адрес кошелька для сбора средств';

        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'PMAGE';
        this.tokenName = 'Ethernal Heroes Token (Private)';
        this.tokenDecimals = 18;
        this.isTokenMintable = false;

        // Сколько токенов доступно для продажи
        this.tokenTotalSupply = 160 * Constant.MILLION;
        // Разрешаем продавать все токены
        this.firstApproveAmount = this.tokenTotalSupply;

        this.startDateTimestamp = Moment(this.startDate).unix();
        this.endDateTimestamp = Moment(this.endDate).unix();

        // Стоимость токена в wei
        this.oneTokenInWei =  1 * Constant.ETHER / 6000;

        // Описание ценовой стратегии
        this.pricingStrategy = [
            // Переводы меньше 15 эфира запрещены, произойдет откат транзакции

            // Перевели от 15, до 50 эфира включительно, получили бонус 25%
            15 * Constant.ETHER, 25 /*%*/,

            // Перевели более 50 эфира, получили бонус 30%
            50 * Constant.ETHER, 30 /*%*/
        ];

    },

    setDevMode : function(opts){
        opts.ownerAddress = opts.ownerAddress || '0x0';
        this.ownerAddress = opts.ownerAddress;
        this.beneficiaryAddress = this.ownerAddress;

        // Адрес, куда будут переводится платежи за токены
        this.tokenWalletAddress = opts.tokenWalletAddress || '0x0';

        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'PMAGE';
        this.tokenName = 'Ethernal Heroes Token (Private)';
        this.tokenDecimals = 18;
        this.isTokenMintable = false;

        // Сколько токенов доступно для продажи
        this.tokenTotalSupply = 200;
        // Разрешаем продавать все токены
        this.firstApproveAmount = this.tokenTotalSupply;

        this.startDateTimestamp = Moment().add(1, "days").unix();
        this.endDateTimestamp = Moment().add(5, "days").unix();

        this.startDate = Moment.unix(this.startDateTimestamp).format("YYYY-MM-DD HH:mm:ss");
        this.endDate = Moment.unix(this.endDateTimestamp).format("YYYY-MM-DD HH:mm:ss");

        // Стоимость токена в wei
        this.oneTokenInWei =  1 * Constant.ETHER;

        // Описание ценовой стратегии
        this.pricingStrategy = [
            // Переводы меньше 15 эфира запрещены, произойдет откат транзакции

            // Перевели от 15, до 50 эфира включительно, получили бонус 25%
            15 * Constant.ETHER, 25 /*%*/,

            // Перевели более 50 эфира, получили бонус 30%
            50 * Constant.ETHER, 30 /*%*/
        ];

    }
};

module.exports = storage;