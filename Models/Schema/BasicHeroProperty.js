const Mongoose = require('mongoose');

module.exports = new Mongoose.Schema({
    level: {
        type: Number,
        default: 1
    },
    equip1: {
        type: Number,
        default: -1
    },
    equip2: {
        type: Number,
        default: -1
    },
    lvle1: {
        type: Number,
        default: -1
    },
    lvle2: {
        type: Number,
        default: -1
    }
});