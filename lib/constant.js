const WEI = 1;

const TEN = 10;
const HUNDRED = 10 * TEN;
const THOUSAND = 10 * HUNDRED;
const MILLION = 1000 * THOUSAND;
const BILLION = 1000 * MILLION;

var constant = {
    WEI : WEI,
    ETHER : Math.pow(10, 18) * WEI,

    TEN : TEN,
    HUNDRED : HUNDRED,
    THOUSAND : THOUSAND,
    MILLION : MILLION,
    BILLION : BILLION
};

module.exports = constant;