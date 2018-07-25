const request = require("request-promise-native");
const { getOption, signature } = require("../utils");

module.exports = async (account) => {
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