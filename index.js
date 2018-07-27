const Coin = require('./module/Coin');
const Account = require('./module/Account');

const pako = require('pako');

const ws = require('./common/websocket');
const logger = require('./utils/logger');

const { buy } = require('./services/trades');

const BASE_COIN = 'usdt';

let account = new Account('4355134');
let coins = [];

let timeChecker = null;

ws.on('open', ()=>{
    if(coins.length > 0){   //重连接只需要重新订阅Kline
        coins.forEach(coin=>coin.subscribeKline());
    }else{
        for(let key in account.positions){
            coins.push(new Coin(key + BASE_COIN, account));
        }
    }
});

ws.on('message', (data)=>{
    //解压gzip数据
    const res = JSON.parse(pako.inflate(data, { to: 'string' }));

    if(res.ping){   //响应ping, 5s一次
        logger.info('ping');
        ws.send(JSON.stringify({"pong": res.ping}));

        //10秒未响应，则尝试重连
        if(timeChecker) clearTimeout(timeChecker);
        timeChecker = setTimeout(()=>{
            ws.reconnect();
        }, 10000);
        return;
    }else{  //响应数据
        try{
          coins.find(async (coin)=> await coin.handle(res));
        }catch(e){
          logger.error(e);
        }
    }
})

ws.open();
