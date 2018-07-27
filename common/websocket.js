const WebSocketClient = require('./WebSocketClient');

const config = {
};

const url = 'wss://api.huobi.pro/ws';

module.exports = new WebSocketClient(url, config);
