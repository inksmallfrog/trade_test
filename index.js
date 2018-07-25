const Coin = require('./module/Coin');
const Account = require('./module/Account');
const ws = require('./common/websockets');
const pako = require('pako');

let account = new Account('4355134');
let coins = [];

ws.on('open', ()=>{
    for(let key in account.positions){
        coins.push(new Coin(key + 'usdt', account));
    }
    console.log('connected to market!')
});

ws.on('message', (data)=>{
    const res = JSON.parse(pako.inflate(data, { to: 'string' }));
    if(res.ping){
        console.log(new Date() + 'ping');
        ws.send(JSON.stringify({"pong": res.ping}));
        return;
    }else{
        coins.find(coin=>coin.handle(res));
    }
})


