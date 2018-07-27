const pako = require('pako');

const Coin = require('./module/Coin');
const Account = require('./module/Account');

const ws = require('./common/websocket');
const { pingPongLogger, errorLogger } = require('./utils/logger');

const config = require('./config');




let account = new Account(config);
let coins = [];

let reconnectTimer = null;

ws.on('open', ()=>{
    if(coins.length > 0){   //重连接只需要重新订阅Kline
        coins.forEach(coin=>coin.subscribeKline());
    }else{  
        account.markedCoins.forEach(coin=>{
            coins.push(new Coin(coin, account));
        });
    }
});

ws.on('message', (data)=>{
    //解压gzip数据
    const res = JSON.parse(pako.inflate(data, { to: 'string' }));

    if(res.ping){   //响应ping, 5s一次
        pingPongLogger.info('ping');
        ws.send(JSON.stringify({"pong": res.ping}));

        //10秒未响应，则尝试重连
        if(reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(()=>{
            ws.reconnect();
        }, 10000);
        return;
    }else{  //响应数据
        coins.find(async (coin)=> {
            try{
                return await coin.handle(res);
            }catch(e){
                errorLogger.error('coin:', coin, ',response:', res, ',error:', e);
            }
        });
    }
})

ws.open();
