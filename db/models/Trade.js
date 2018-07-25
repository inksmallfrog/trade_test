module.exports = {
    key:  String,
    price: Number,
    volumn: Number,
    action: {
        type: String,
        enum: ['buy', 'sell']
    }
}