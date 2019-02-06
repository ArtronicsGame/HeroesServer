const Mongoose = require('mongoose');
const HeroPropertiesSchema = require('./Schema/HeroProperty');

module.exports = Mongoose.model("Matches", Mongoose.Schema({
    actions: Buffer,
    teamAScore: { type: Number, default: 0 },
    teamBScore: { type: Number, default: 0 },
    playerIds: [{ type: Mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    heroesProperties: [HeroPropertiesSchema]
}));