const WebSocketClient = require('./WebSocketClient');

const config = {
};

const HUOBI_API_WS = 'wss://api.huobi.pro/ws';

module.exports = new WebSocketClient(HUOBI_API_WS, config);
