const { Position } = require('../db');

module.exports = {
    async queryDB({hopePosition}){
        let res = {};
        for(let key in hopePosition){
            let position = await Position.findOne({key}).exec();
            if(position == null){
                position = new Position({key, cost:0, usdtInvested:0, volumn:0});
                position.save();
            }
            res[key] = position;
        }
        return res;
    },
    async update(key, coinInfo){
        await Position.updateOne({key}, {...coinInfo});
    }
}