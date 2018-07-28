const { Balance, Position, Trade, Order } = require('../services');
const { strategyLogger, tradeLogger } = require('../utils/logger');

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
            this.totalUsdt += +(res[key].usdtInvested);
        }
    }

    //实际持仓以接口数据为准
    async queryPositionFromAPI(){
        const allBalances = await Balance.query(this.id);
        allBalances.forEach((coin)=>{
            if(coin.currency == 'usdt'){
                this.usdtAvailable = coin.balance;
                this.totalUsdt += +coin.balance;
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
        //最少交易1usdt
        if(newInvested < 1){
            newInvested = 1;
                positionAfterBuy = (newInvested / this.totalUsdt) + (+coinInfo.position);
        }

        if(positionAfterBuy <= coinInfo.hope){
            strategyLogger.info('agree to buy ', coin, ' at ', price, ' positionAfterBuy:', positionAfterBuy, 'positionHope:', coinInfo.hope);

            //计算数据
            let newVolumn = newInvested / price;

            //最少成交0.012个币(算上交易费)
	        if(newVolumn < 0.012){
                newVolumn = 0.012;
                newInvested = newVolumn * price;
            }

            let orderId = await Trade.trade('buy', coin + this.baseCoin, newInvested, this.id);
            if(orderId){
                let realOrder = await Order.query(orderId);
                if(realOrder.state == 'filled'){
                    tradeLogger.log('trade buy down, id:', orderId, 
                        " price:", realOrder.price, 
                        " amount:", realOrder["field-amount"],
                        " field-fees:", realOrder["field-fees"]);

                    newInvested = +realOrder["field-cash-amount"];
                    newVolumn = +realOrder["field-amount"];

                    let newCost = (coinInfo.cost * coinInfo.volumn + newInvested) / (+coinInfo.volumn + newVolumn);
                    coinInfo.cost = newCost;
                    coinInfo.volumn += newVolumn;
                    coinInfo.usdtInvested += newInvested;
                    coinInfo.position = (newInvested / this.totalUsdt) + (+coinInfo.position);            

                    await Position.update(coin, coinInfo);
                    await Trade.write2DB(coin, 'buy', price, newVolumn);
                    this.usdtAvailable -= newInvested;
                    strategyLogger.info('buy down,', coin, price);
                    strategyLogger.info('usdtAvailable:', this.usdtAvailable);
                    return true;
                }else{
                    tradeLogger.error('trade buy partial, id:', orderId, 'coin:', coin);    
                    return false;
                }
            }else{
                strategyLogger.info('refuse to buy! cauze no orderId!');
                return false;
            }
        }else{
            strategyLogger.info('refuse to buy! cauze hopePosition:', coinInfo.hope, ' afterBuy:', positionAfterBuy);
            return false;
        }
    }

    async sell(coin, price){
        let coinInfo = this.positions[coin];
        if(coinInfo.volumn < 0.01){
            strategyLogger.info('refuse to sell! cauze coin less than 0.01. real volumn:'. coinInfo.volumn);
            return false;
        }
        if(price * (1 - this.tradeFee) > coinInfo.cost){
            const erned = (price * (1 - this.tradeFee) - coinInfo.cost) * coinInfo.volumn;
            strategyLogger.info('agree to sell ', coin, ' at ', price, 'erned', erned);

            let orderId = await Trade.trade('sell', coin + this.baseCoin, coinInfo.volumn, this.id);
            if(orderId){
                let realOrder = await Order.query(orderId);
                if(realOrder.state == 'filled'){
                    tradeLogger.log('trade sell down, id:', orderId, 
                        " price:", realOrder.price, 
                        " amount:", realOrder["field-amount"],
                        " field-fees:", realOrder["field-fees"]);

                    let usdt = +realOrder["field-cash-amount"] - realOrder["field-fees"];
                    let volumn = +realOrder["field-amount"];

                    this.usdtAvailable += usdt;
                    let erned = usdt - volumn * coinInfo.cost;
                    this.totalEarned += erned;
                    this.totalUsdt += erned;

                    coinInfo.volumn -= volumn;
                    coinInfo.usdtInvested = coinInfo.volumn * coinInfo.cost;
                    coinInfo.position = coinInfo.usdtInvested / this.totalUsdt;
                    await Position.update(coin, coinInfo);
                    await Trade.write2DB(coin, 'sell', price, coinInfo.volumn);
                    strategyLogger.info('sell down,', coin, realOrder.price);
                    strategyLogger.info('erned:', erned);
                    strategyLogger.info('usdtAvailable:', this.usdtAvailable);
                    strategyLogger.info('totalErned:', this.totalEarned);
                    return true;
                }else{
                    tradeLogger.error('trade sell partial, id:', orderId, 'coin:', coin);    
                    return false;
                }
            }else{
                strategyLogger.info('refuse to sell! cauze no orderId!');
		        return false;
	        }
        }else{
            strategyLogger.info('refuse to sell! cauze price<cose:', price * (1 - this.tradeFee), '<', coinInfo.cost);
	        return false;
        }
    }
}
