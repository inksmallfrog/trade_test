const { strategyLogger } = require('../utils/logger');

module.exports = class {
    run(data){
        if(data.close && data.boll){
            let res = {
                buy: false,
                sell: false
            }
            if(data.boll.upper.length < 21 || data.boll.lower.length < 21) return res;
            if(data.close <= data.boll.lower[data.boll.lower.length - 1]){
                strategyLogger.info('bollingStrategy suggest to buy', data.coin, ' at ', data.close)
                res.buy = true;
            }else if(data.close >= data.boll.upper[data.boll.upper.length - 1] && data.cost < data.close){
                strategyLogger.info('bollingStrategy suggest to sell', data.coin, ' at ', data.close)
                res.sell = true;
            }
            return res;
        }else{
            throw new Error("[ERROR]: must give close & boll as parameters")
        }
    }
}