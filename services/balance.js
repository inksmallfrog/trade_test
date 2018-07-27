const request = require("request-promise-native");
const { getQueryStr, getRequestOpt, signature } = require("../utils/huobi");
const { errorLogger } = require('../utils/logger');

module.exports = {
    async query(accountId){
        try{
            const url = `/v1/account/accounts/${accountId}/balance`;
            let res = await request(huobiHandle({url}));
            if(res.data && res.data.list){
                return res.data.list.filter((coinBalance)=>{
                    return coinBalance.balance >= 0.01;
                });        
            }else{
                return [];
            }
        }catch(e){
            errorLogger.error('error in balance API:', e);
            return [];
        }
    }
}



async (account) => {
    try{
        const rUrl = signature({
            url: `/v1/account/accounts/${account}/balance`
        });
        let res = await request(getOption(rUrl));
        return res.data.list.filter((coinBalance)=>{
            return coinBalance.balance >= 0.01;
        })
    }catch(e){
        console.log(e);
        throw new Error(e);
    }
}