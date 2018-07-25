const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/coin_trade', { useNewUrlParser: true });
console.log('mongoDB connected');

module.exports = mongoose;