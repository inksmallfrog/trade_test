const mongoose = require('mongoose');
const config = require('./config/db.js');

const mongoDBUrl = 'mongodb://' + config.user + ':' + config.pwd + '@' 
                    + config.host + ':' + config.port + '/' + config.dbName;

mongoose.connect(mongoDBUrl, { useNewUrlParser: true });
console.log('mongoDB connected');

module.exports = mongoose;