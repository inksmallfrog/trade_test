const BollingerBands = require('./BollingerBands');
const ws = require('../common/websocket');
const Strategy = require('../strategies/BollStrategy');
const { errorLogger, strategyLogger } = require('../utils/logger');

const strategy = new Strategy();

module.exports = class{
    constructor(key, account){
        this.key = key;
        this.coinName = key.substr(0, key.length - 4);
        this.account = account;
        this.boll = new BollingerBands(20, 2);
        this.lastKlineId = 0;
        this.buyLock = false;

        let date = new Date();
        ws.send(JSON.stringify({
            "req": `market.${this.key}.kline.15min`,
            "id": `kline${this.key}`,
            "from": Math.floor(date.getTime() / 1000) - 330 * 60
        }));
    }

    handle(message){
        if(message.ch){
            const currency = message.ch.split(".")[1];
            if(currency != this.key){ return false; }
            
            if(message.tick.id == this.lastKlineId){
                this.boll.updateData(message.tick.close);
            }else{
                this.boll.addData(message.tick.close);
                this.lastKlineId = message.tick.id;
            }
            
            const data = {
                coin: this.key,
                cost: this.account.positions[this.coinName].cost,
                close: message.tick.close,
                boll: this.boll.boolingerBands
            }

            let res;
            try{
                res = strategy.run(data);
            }catch(e){
                errorLogger.error('run strategy error!', data, e);
            }
            
            if(res.buy && !this.buyLock){
		const buyPromise = new Promise(async (resolve, reject)=>{
		    let buySucc = await this.account.buy(this.coinName, message.tick.close);
			if(buySucc){
			    resolve()
			}else{
			    reject()
			}
		});
		buyPromise.then(()=>{	
	            this.buyLock = true;
	      	    setTimeout(() => {
                    	this.buyLock = false;
	            }, 900 * 1000);
		}).catch(()=>{});
            }else if(this.buyLock){
                strategyLogger.info('coin refused buy cauze buyLock');
            }
            if(res.sell){
                this.account.sell(this.coinName, message.tick.close);
            }
            return true;
        }
        if(message.rep && message.id == `kline${this.key}`){
            message.data.forEach((kline)=>{
                this.boll.addData(kline.close);
                if(kline.id > this.lastKlineId){
                    this.lastKlineId = kline.id;
                }
            });
            this.subscribeKline();
            return true;
        }
	return false;
    }
    subscribeKline(){
        ws.send(JSON.stringify({
            "sub": `market.${this.key}.kline.15min`,
            "id": `id${this.key}`
        }));
    }
}
