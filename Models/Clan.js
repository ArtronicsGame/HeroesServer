class Clan {
    constructor(ClanID, name, description, leader) {
        this._Clan_id = ClanID;
        this._name = name;
        this._description = description;
        this._clan_members_id = [leader._id];
        this._trophies = leader._trophies;
        this._messages = [];
    }
}

module.exports = Clan;