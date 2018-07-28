const request = require("request-promise-native");
const { huobiHandle } = require("../utils/huobi");
const { errorLogger } = require('../utils/logger');

module.exports = {
    async query(orderId){
        try{
            const url = `/v1/order/orders/${orderId}`;
            let res = await request(huobiHandle({url}));
            if(res.data){
                return res.data;  
            }else{
                errorLogger.error('unexpected error! no such order!', orderId);
                return null;
            }
        }catch(e){
            errorLogger.error('error in order API:', e);
            return [];
        }
    }
}