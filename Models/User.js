const Mongoose = require('mongoose');
const HeroPropertiesSchema = require('./Schema/HeroProperty.js');
const itemPropertiesSchema = require('./Schema/ItemProperty.js');

const HeroPropertiesModel = Mongoose.model("Hero", HeroPropertiesSchema);


module.exports = Mongoose.model("Users", new Mongoose.Schema({
    username: { type: String, required: true, unique: true },
    trophies: { type: Number, default: 0 },
    coins: { type: Number, default: 500 },
    experience: { type: Number, default: 0 },
    heroesProperties: {
        type: Map, of: HeroPropertiesSchema, default: {
            IceMan: new HeroPropertiesModel(),
            BlackHole: new HeroPropertiesModel(),
            Healer: new HeroPropertiesModel(),
            Tank: new HeroPropertiesModel(),
            Wizard: new HeroPropertiesModel(),
            Cloner: new HeroPropertiesModel(),
            Invoker: new HeroPropertiesModel(),
            ClockMan: new HeroPropertiesModel()
        }
    },
    itemsProperties: [itemPropertiesSchema],
    currentHero: { type: String, enum: ["IceMan", "BlackHole", "Healer", "Tank", "Wizard", "Cloner", "Invoker", "ClockMan", "None"], default: "None" },
    recentlyMatches: { type: Array, of: Mongoose.Schema.Types.ObjectId, ref: 'Matches' },
    clan: { type: Mongoose.Schema.Types.ObjectId, default: null, ref: 'Clans' },
    tournament: { type: Mongoose.Schema.Types.ObjectId, default: null },
    matchIP: { type: String, default: "None" },
    matchPort: { type: String, default: -1 },
    playerLog: [String],
    playerClanPosition: { type: String, enum: ["Leader", "Co-Leader", "Member", "None"], default: "None" }
}));