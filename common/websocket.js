const WebSocketClient = require('./WebSocketClient');

const SocksProxyAgent = require('socks-proxy-agent');
const proxy = process.env.socks_proxy || 'socks://127.0.0.1:1080';
const config = {
    agent: new SocksProxyAgent(proxy)
};

const url = 'wss://api.huobi.pro/ws';

module.exports = new WebSocketClient(url, config);