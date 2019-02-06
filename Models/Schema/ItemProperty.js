const Mongoose = require('mongoose');

module.exports = new Mongoose.Schema({
    level: {type: Number, default: 1},
    numberOfCards: {type: Number, default: 0}
});