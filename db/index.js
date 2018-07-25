const mongoose = require("./db");
const PositionSchema = require("./models/Position");
const TradeSchema = require("./models/Trade");

exports.Position = mongoose.model('Position', PositionSchema);
exports.Trade = mongoose.model('Trade', TradeSchema);
