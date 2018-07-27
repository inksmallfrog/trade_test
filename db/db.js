const mongoose = require('mongoose');
mongoose.connect('mongodb://admin:inksma11frog@localhost:27017/coin_trade', { useNewUrlParser: true });
console.log('mongoDB connected');

module.exports = mongoose;
