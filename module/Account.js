const { Balance, Position, Trade } = require('../services');
const { strategyLogger } = require('../utils/logger');

module.exports = class{
    constructor(config){
        this.id = config.accountId;
        this.baseCoin = config.baseCoin;
        this.tradeFee = config.tradeFee;
        this.positionFirstAdd = config.positionFirstAdd;
        this.positionPerAdd = config.positionPerAdd;
        this.config = config;

        this.markedCoins = [];
        this.positions = {};
        for(let key in config.hopePosition){
            this.markedCoins.push(key + this.baseCoin);
            this.positions[key] = {
                hope: config.hopePosition[key],
                current: 0,
                volumn: 0,
                cost: 0,
                usdtInvested: 0,
            }
        }

        this.totalUsdt = 0;
        this.usdtAvailable = 0;
        this.totalEarned = 0;

        //异步加载数据锁
        this.dataLoaded = false;
        this.positionCal = false;

        this.calPosition();
    }

    //获取数据库和线上数据
    async calPosition(){
        //实际仓位以API为准
        await this.queryPositionFromDB();
        await this.queryPositionFromAPI();
    
        this.dataLoaded = true;

        for(let key in this.positions){
            this.positions[key].position = (this.positions[key].usdtInvested / this.totalUsdt);
        }
    }

    //获取数据库数据
    async queryPositionFromDB(){
        const res = await Position.queryDB(this.config);
        for(let key in res){
            this.positions[key].cost = res[key].cost;
            this.positions[key].volumn = +res[key].volumn;
            this.positions[key].usdtInvested = res[key].usdtInvested;
            this.totalUsdt += res[key].usdtInvested;
        }
    }

    //实际持仓以接口数据为准
    async queryPositionFromAPI(){
        const allBalances = await Balance.query(this.id);
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
        strategyLogger.info('ask to buy ' + coin + ' at ' + price);

        let coinInfo = this.positions[coin];
        let positionAfterBuy = 0;
        let newInvested = 0;

        if(coinInfo.position > 0){  //加仓
            if(coinInfo.cost <= price){
                strategyLogger.info('refuse to buy! cauze price>=cost:' + price + '>=' + coinInfo.cost);
                return false;
            }

            //计算买入后的数据
            positionAfterBuy = (1 + this.positionPerAdd) * coinInfo.position;
            newInvested = this.positionPerAdd * coinInfo.position * coinInfo.usdtInvested;
        }else{  //初次买入
            newInvested = (this.positionFirstAdd * coinInfo.hope) * this.usdtAvailable;
            positionAfterBuy = newInvested / this.totalUsdt;
        }

        if(positionAfterBuy <= coinInfo.hope){
            strategyLogger.info('agree to buy ', coin, ' at ', price, ' positionAfterBuy:', positionAfterBuy, 'positionHope:', coinInfo.hope);

            //计算数据
            const newVolumn = newInvested / price;
            const newCost = (coinInfo.cost * coinInfo.volumn + newInvested * (1 + (+this.tradeFee))) / (+coinInfo.volumn + (+newVolumn));
            coinInfo.cost = newCost;
            coinInfo.volumn += +newVolumn;
            coinInfo.usdtInvested += +newInvested;
            coinInfo.position = positionAfterBuy;

            this.usdtAvailable -= (1 + (+this.tradeFee)) * newInvested;

            await Trade.trade('buy', coin + this.baseCoin, newInvested, this.id);
            Position.update(coin, coinInfo);
            Trade.write2DB(coin, 'buy', price, newVolumn);

            strategyLogger.info('buy down,', coin, price);
            strategyLogger.info('usdtAvailable:', this.usdtAvailable);
            return true;
        }else{
            strategyLogger.info('refuse to buy! cauze hopePosition:', coinInfo.hope, ' afterBuy:', positionAfterBuy);
	        return false;
        }
    }

    async sell(coin, price){
        let coinInfo = this.positions[coin];
        if(price * (1 - this.tradeFee) > coinInfo.cost && coinInfo.position > 0){
            const erned = (price * (1 - this.tradeFee) - coinInfo.cost) * coinInfo.volumn;
            strategyLogger.info('agree to sell ', coin, ' at ', price, 'erned', erned);

            coinInfo.cost = 0;
            coinInfo.volumn = 0;
            coinInfo.usdtInvested = 0;
            coinInfo.position = 0;
            this.usdtAvailable += price * (1 - (+this.tradeFee)) * coinInfo.volumn;
            
            await Trade.trade('sell', coin + this.baseCoin, coinInfo.volumn, this.id);
            Position.update(coin, coinInfo);
            Trade.write2DB(coin, 'sell', price, coinInfo.volumn);
            this.totalEarned += +erned;

            strategyLogger.info('sell down,', coin, price);
            strategyLogger.info('usdtAvailable:', this.usdtAvailable);
            strategyLogger.info('totalErned:', this.totalEarned);
            return true;
        }else{
            if(coinInfo.position > 0){
                strategyLogger.info('refuse to sell! cauze price<cose:', price * (1 - this.tradeFee), '<', coinInfo.cost);
            }else{
                strategyLogger.info('refuse to sell! cauze no position for ', coin);
            }            
	        return false;
        }
    }
}
