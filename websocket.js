const balanceApi = require('./module/balance.js');
const positionApi = require('./module/position.js');

const pako = require('pako');
const request = require('request-promise-native');
const BoolingerBands = require('./services/boolinger-bands');



balance = {};
ethusdt = 0;

function calEthTotal(){
    let total = 0;
    for(currency in balance){
        const coin = balance[currency];
        total += coin.balance * coin.price;
    }
    return total;
}

ws.on('open', async ()=>{
    ws.send(JSON.stringify({"ping": 18212553000}));
    const res = await balanceApi();
    res.forEach(async (coin)=>{
        if(coin.currency != 'eth'){
            const position = await positionApi(coin.currency + 'eth');
            console.log("position: " + JSON.stringify(position) + " " + coin.currency);
            
            balance[coin.currency] = {
                balance: coin.balance
            }
        }else{
            ws.send(JSON.stringify({
                "sub": `market.${coin.currency}usdt.kline.1min`,
                "id": `id${coin.currency}`
            }));
            balance["eth"] = {
                balance: coin.balance,
                price: 1
            }
        }
    });
})

ws.on('message', function incoming(data) {
    const res = JSON.parse(pako.inflate(data, { to: 'string' }));
    if(res.ping){
        ws.send(JSON.stringify({"pong": res.ping}));
    }else{
        if(res.ch){
            let currency = res.ch.split(".")[1];
            if(currency == 'ethusdt'){
                ethusdt = res.tick.close;
            }else{
                currency = currency.substr(0, currency.length - 3);
                balance[currency].price = res.tick.close;
                console.log(currency + ": " + res.tick.close);
            }
            
            //const rmb = await request(opt);
            const ethTotal = calEthTotal();
            console.log("ethTotal: " + ethTotal);
            console.log("usdt: " + ethTotal * ethusdt);

        }
    }
});



