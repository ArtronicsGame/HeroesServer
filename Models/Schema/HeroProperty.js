const Mongoose = require('mongoose');
const BasicHeroPropertySchema = require("./BasicHeroProperty.js");

const BasicHeroPropertyModel = Mongoose.model("BasicHeroProperty", BasicHeroPropertySchema);

module.exports = new Mongoose.Schema({
    isUnlocked: { type: Boolean, default: false },
    experience: { type: Number, default: 0 },
    trophies: { type: Number, default: 0 },
    basicInfo: { type: BasicHeroPropertySchema, default: new BasicHeroPropertyModel() }
});