const request = require("request-promise-native");
const { huobiHandle } = require("../utils/huobi");
const { errorLogger } = require('../utils/logger');

module.exports = {
    async query(accountId){
        try{
            const url = `/v1/account/accounts/${accountId}/balance`;
            let res = await request(huobiHandle({url}));
            if(res.data && res.data.list){
                return res.data.list.filter(coin => coin.type == 'trade');        
            }else{
                return [];
            }
        }catch(e){
            errorLogger.error('error in balance API:', e);
            return [];
        }
    }
}
