const Mongoose = require('mongoose');
const HeroPropertiesSchema = require('./Schema/HeroProperty');

module.exports = Mongoose.model("Matches", Mongoose.Schema({
    matchIP: {
        type: String,
        default: "None"
    },
    matchPort: {
        type: String,
        default: -1
    },
    actions: Buffer,
    teamAScore: {
        type: Number,
        default: 0
    },
    teamBScore: {
        type: Number,
        default: 0
    },
    playerIds: [{
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }],
    isRunning: {
        type: Boolean,
        default: true
    },
    heroesProperties: [HeroPropertiesSchema]
}));