var AbstractHeroProperty = require("./AbstractHeroProperty.js");
class HeroPropery extends AbstractHeroProperty {
    constructor() {
        this._experience = 0;
        this._trophies = 0;
    }
}

module.exports = HeroPropery;