const BollingerBands = require('./BollingerBands');
const ws = require('../common/websocket');
const Strategy = require('../strategies/BollStrategy');
const strategy = new Strategy();

let totalErned = 0;

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
                cost: this.account.positions[this.coinName].cost,
                close: message.tick.close,
                boll: this.boll.boolingerBands
            }
            console.log(currency + ": " + message.tick.close + "[" + data.boll.lower[data.boll.lower.length - 1] + "]" + " up:" + (message.tick.close - data.boll.lower[data.boll.lower.length - 1]));
            const res = strategy.run(data);
            if(res.buy && !this.buyLock){
                console.log('buy');
                this.account.buy(this.coinName, message.tick.close);
                this.buyLock = true;
                setTimeout(() => {
                    this.buyLock = false;
                }, 900 * 1000);
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
    }
    subscribeKline(){
        ws.send(JSON.stringify({
            "sub": `market.${this.key}.kline.15min`,
            "id": `id${this.key}`
        }));
    }
}