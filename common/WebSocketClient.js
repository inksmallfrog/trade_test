const WebSocket = require('ws');
const logger = require('../utils/logger');

const ECONNREFUSED = 'ECONNREFUSED';

class WebSocketClient{
    constructor(url, config){
        this.url = url;
        this.config = config;
        this.instance = null;
        this.listeners = {};
        this.waitToSend = [];
    }
    open(){
        this.instance = new WebSocket(this.url, this.config);
        logger.info('websocket connect!');
        for(let key in this.listeners){
            this.instance.on(key, this.listeners[key]);
        }
        this.waitToSend.forEach((message)=>{
            this.instance.send(message.data, message.option);
        })
        this.waitToSend.length = 0;
    }
    on(eventName, cb){
        let parsedCb;
        if(eventName == 'close'){
            parsedCb = function(e){
                switch(e.code){
                    case 1000:  //CLOSE_NORMAL
                        cb();
                        logger.info('websocket closed.');
                        break;
                    default:
                        logger.error('websocket unexpected close!');
                        this.reconnect();
                        break;
                }
            }
        }
        if(eventName == 'error'){
            parsedCb = function(e){
                switch(e.code){
                    case ECONNREFUSED:
                        logger.error('websocket ECONNREFUSED!');
                        this.reconnect();
                        break;
                    default:
                        logger.error('websocket error', e);
                        cb();
                        break;
                }
            }
        }

        if(parsedCb){
            cb = parsedCb;
        }
        if(this.instance){
            this.instance.on(eventName, cb);
        }
        this.listeners[eventName] = cb;
    }
    send(data, option){
        if(this.instance){
            try{
                this.instance.send(data, option);
            }catch (e){
                logger.error('send failed!', data, option, e);
            }
        }else{
            this.waitToSend.push({
                data,
                option
            });
        }
    }
    reconnect(e){
        logger.info('try to reconnect...');
        this.instance.removeAllListeners();
        this.open();
    }
}

module.exports = WebSocketClient;