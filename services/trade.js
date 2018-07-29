const { Trade } = require('../db');
const request = require("request-promise-native");
const { huobiHandle } = require("../utils/huobi");
const { errorLogger, tradeLogger } = require("../utils/logger");


module.exports = {
    async write2DB(coin, action, price, volumn){
        let trade = new Trade({
            key: coin,
            price,
            action,
            volumn
        });
        try{
            await trade.save();
        }catch(e){
            errorLogger.error("trade write2DB error:", e, coin, action, price, volumn);
        }
    },
    async trade(action, symbol, amount, accountId){
        if(action != 'buy' && action != 'sell'){
            errorLogger.error("call trade with wrong action:" + action);
            return null;
        }
        try{
	    amount = Number(amount).toFixed(4);
            const url = `/v1/order/orders/place`;
            const method = 'POST';
            const body = {
                'account-id': accountId,
                'amount': '' + amount,
                'source': 'api',
                'symbol': symbol,
                'type': action + '-market'
            };
            let res = await request.post(huobiHandle({url, method, body}));
            if(res.data){
                tradeLogger.info(action, symbol, ' for ', amount, ' ret:', res.data );
            }else{
                errorLogger.error('call ',action, ' api failed! res.data:', res);
            }
	    return res.data;
        }catch(e){
            errorLogger.error('call ', action, ' api failed! catched: ', e);
	    return null;
        }
    }
}

// async function checkOrder(orderId){
//     try{
//         const rUrl = signature({
//             url: `/v1/order/orders/${orderId}`,
//         });
//         let res = await request(getOption(rUrl));
//         if(res.data['field-amount'] != res.data['amount']){}
//         return res.data.data;
//     }catch(e){
//         console.log(e);
//         throw new Error(e);
//     }
// }
