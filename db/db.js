const mongoose = require('mongoose');
const config = require('../config/db.js');

let mongoDBUrl = 'mongodb://'
if(config.user && config.pwd){
    mongoDBUrl += config.user + ':' + config.pwd + '@'
}
mongoDBUrl += config.host + ':' + config.port + '/' + config.dbName;

mongoose.connect(mongoDBUrl, { useNewUrlParser: true });
console.log('mongoDB connected');

module.exports = mongoose;