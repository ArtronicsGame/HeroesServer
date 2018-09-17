class Clan {
    constructor(name, leader) {
        this._name = name;
        this._description = "";
        this._clan_members_id = [leader._id];
        this._trophies = leader._trophies;
        this._messages = [];
    }
}

module.exports = Clan;