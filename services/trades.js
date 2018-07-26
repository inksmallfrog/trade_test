const { Trade } = require('../db');
const request = require("request-promise-native");
const { getOption, signature } = require("../utils");

exports.addTrade = async function(coin, action, price, volumn){
    let trade = new Trade({
        key: coin,
        price,
        action,
        volumn
    });
    
    await trade.save();
}

async function checkOrder(orderId){
    try{
        const rUrl = signature({
            url: `/v1/order/orders/${orderId}`,
        });
        let res = await request(getOption(rUrl));
        if(res.data['field-amount'] != res.data['amount']){}
        return res.data.data;
    }catch(e){
        console.log(e);
        throw new Error(e);
    }
}

exports.buy = async function(symbol, amount, accountId){
    try{
        const rUrl = signature({
            url: `/v1/order/orders/place`,
            method: 'POST'
        });
        console.log(rUrl);
        console.log(getOption(rUrl, 'POST', {
            'account-id': accountId,
            'amount': amount,
            'source': 'api',
            'symbol': symbol,
            'type': 'buy-market'
        }))
        let res = await request.post(getOption(rUrl, 'POST', {
            'account-id': accountId,
            'amount': '' + amount,
            'source': 'api',
            'symbol': symbol,
            'type': 'buy-market'
        }));
        console.log('buy api result: ' + res.data);
        return res.data.data;
    }catch(e){
        console.log(e);
        throw new Error(e);
    }
}

exports.sell = async function(symbol, amount, accountId){
    try{
        const rUrl = signature({
            url: `/v1/order/orders/place`,
            method: 'POST'
        });
        console.log('call sell api - ');
        console.log(rUrl);
        let res = await request.post(getOption(rUrl, 'POST', {
            'account-id': accountId,
            'amount': amount,
            'source': 'api',
            'symbol': symbol,
            'type': 'sell-market'
        }));
        console.log('sell api result: ' + res.data);
        return res.data.data;
    }catch(e){
        console.log(e);
        throw new Error(e);
    }
}