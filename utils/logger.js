const path = require('path');
const Logger = require('logger');

exports.errorLogger = Logger.createLogger(path.join(__dirname, '../log/error.log'));
exports.pingPongLogger = Logger.createLogger(path.join(__dirname, '../log/pingpong.log'));
exports.strategyLogger = Logger.createLogger(path.join(__dirname, '../log/strategy.log'));
exports.tradeLogger = Logger.createLogger(path.join(__dirname, '../log/trade.log'));