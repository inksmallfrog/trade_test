const WebSocket = require('ws');
const { pingPongLogger, errorLogger } = require('../utils/logger');

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
     
        pingPongLogger.info('connected to market!');
        console.log('connected to market');
     
        //将连接建立前准备的消息进行发送
        for(let key in this.listeners){
            this.instance.on(key, this.listeners[key]);
        }
        this.waitToSend.forEach((message)=>{
            this.instance.send(message.data, message.option);
        })
        this.waitToSend.length = 0;
    }
    on(eventName, cb){
        if(!cb) cb = function(){};

        //包装close和error事件
        let parsedCb;
        if(eventName == 'close'){
            parsedCb = function(e){
                switch(e.code){
                    case 1000:  //CLOSE_NORMAL
                        cb();
                        pingPongLogger.info('websocket closed.');
                        break;
                    default:
                        errorLogger.error('websocket unexpected close!');
                        this.reconnect();
                        break;
                }
            }
        }
        if(eventName == 'error'){
            parsedCb = function(e){
                switch(e.code){
                    case ECONNREFUSED:
                        errorLogger.error('websocket ECONNREFUSED!');
                        this.reconnect();
                        break;
                    default:
                        errorLogger.error('websocket error:', e);
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

        //记录事件响应函数以便重新连接时恢复
        this.listeners[eventName] = cb;
    }
    send(data, option){
        if(this.instance){
            try{
                this.instance.send(data, option);
            }catch (e){
                errorLogger.error('send failed! data:', data, ',option:', option, ',error:', e);
            }
        }else{
            this.waitToSend.push({
                data,
                option
            });
        }
    }
    reconnect(e){
        pingPongLogger.info('try to reconnect...');
        this.instance.removeAllListeners();
        this.instance.close();
        this.open();
    }
}

module.exports = WebSocketClient;
