const WebSocket = require('ws');
const SocksProxyAgent = require('socks-proxy-agent');
var proxy = process.env.socks_proxy || 'socks://127.0.0.1:1080';

module.exports = new WebSocket('wss://api.huobi.pro/ws',{
    agent: new SocksProxyAgent(proxy)
});