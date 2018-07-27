const WebSocketClient = require('./WebSocketClient');

const SocksProxyAgent = require('socks-proxy-agent');	
const proxy = process.env.socks_proxy || 'socks://127.0.0.1:1080';

const config = {
    agent: new SocksProxyAgent(proxy)
};

const HUOBI_API_WS = 'wss://api.huobi.pro/ws';

module.exports = new WebSocketClient(HUOBI_API_WS, config);
