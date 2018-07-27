const config = require("../config/");
const queryBalance = require('../services/balance');
const { queryPositionByConfig, updatePosition } = require('../services/positions');
const { addTrade, buy, sell } = require('../services/trades');
const logger = require('../utils/logger');

module.exports = class{
    constructor(id){
        this.id = id;
        this.config = config[id];
        this.positions = {};
        this.usdtAvailable = 0;
        this.dataLoaded = false;
        this.tradeFee = this.config.tradeFee;
        this.totalUsdt = 0;
        this.totalEarned = 0;

        for(let key in this.config.hopePosition){
            this.positions[key] = {
                hope: this.config.hopePosition[key],
                current: 0,
                usdtInvested: 0,
                volumn: 0,
                cost: 0
            }
        }

        this.calPosition();
    }

    //获取数据库和线上数据
    async calPosition(){
        await Promise.all([this.queryPositionFromDB(), this.getPosition()]);
        for(let key in this.positions){
            this.positions[key].position = (this.positions[key].usdtInvested / this.usdtAvailable)
        }
        this.dataLoaded = true;
    }

    //获取数据库数据
    async queryPositionFromDB(){
        const res = await queryPositionByConfig(this.config);
        for(let key in res){
            this.positions[key].cost = res[key].cost;
            this.positions[key].volumn = +res[key].volumn;
            this.positions[key].usdtInvested = res[key].usdtInvested;
            this.totalUsdt += res[key].usdtInvested;
        }
    }

    //实际持仓以接口数据为准
    async getPosition(){
        const allBalances = await queryBalance(this.id);
        allBalances.forEach((coin)=>{
            if(coin.currency == 'usdt'){
                this.usdtAvailable = coin.balance;
                this.totalUsdt += coin.balance;
            }else if(this.positions[coin.currency]){
                this.positions[coin.currency].volumn = +coin.balance;
            }
        })
    }

    async buy(coin, price){
        let coinInfo = this.positions[coin];
        let positionAfterBuy = 0;
        let newInvested = 0;
        if(coinInfo.position > 0){
            if(coinInfo.cost <= price){return;}
            positionAfterBuy = 1.05 * coinInfo.position;
            newInvested = 0.05 * coinInfo.position * coinInfo.usdtInvested;
        }else{
            newInvested = (0.25 * coinInfo.hope) * this.usdtAvailable;
            positionAfterBuy = newInvested / this.totalUsdt;
        }
        if(positionAfterBuy <= coinInfo.hope){
            const newVolumn = newInvested / price;
            const newCost = (coinInfo.cost * coinInfo.volumn + newInvested * (1 + (+this.tradeFee))) / (+coinInfo.volumn + (+newVolumn));
            coinInfo.cost = newCost;
            coinInfo.volumn += +newVolumn;
            coinInfo.usdtInvested += +newInvested;
            coinInfo.position = positionAfterBuy;
            this.usdtAvailable -= (1 + (+this.tradeFee)) * newInvested;
            await buy(coin + 'usdt', newInvested, this.id);
            updatePosition(coin, coinInfo);
            addTrade(coin, 'buy', price, newInvested / price);
            logger.info('buy,' + coin + ',' + price);
            logger.info('usdtAvailable,' + this.usdtAvailable);
            return true;
        }else{
            logger.info('account refused buy! reson: hopePosition - ' + coinInfo.hope + ' afterBuy - ' + positionAfterBuy);
	    return false;
        }
    }

    async sell(coin, price){
        let coinInfo = this.positions[coin];
        if(price * (1 - this.tradeFee) > coinInfo.cost && coinInfo.position > 0){
            const erned = (price * (1 - this.tradeFee) - coinInfo.cost) * coinInfo.volumn;

            coinInfo.cost = 0;
            coinInfo.volumn = 0;
            coinInfo.usdtInvested = 0;
            coinInfo.position = 0;
            this.usdtAvailable += price * (1 - (+this.tradeFee)) * coinInfo.volumn;
            
            await sell(coin + 'usdt', newInvested, this.id);
            updatePosition(coin, coinInfo);
            addTrade(coin, 'sell', price, coinInfo.volumn);
            logger.info('sell,' + coin + ',' + price);
            logger.info('erned,' + erned);
            this.totalEarned += +erned;
            logger.info('totalErned,' + this.totalEarned);
        }
    }
}
