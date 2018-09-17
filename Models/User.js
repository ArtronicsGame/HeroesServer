class User {
    constructor(id) {
        this._id = id;
        this._username = '';
        this._trophies = 0;
        this._coins = 500;
        this._experience = 0;
        this._heroes_properties = {_iceman:{}, _black_hole:{}, _healer:{}, _tank:{}, _wizard:{}, _cloner:{}, _invoker:{}, _clockman:{}};
        this._items_property = [];
        this._current_hero = 'a random hero';
        this._recently_matches_id = [];
        this._clan_id = 0;
        this._tournament_id = 0;
        this._player_log = 'player-report';
        this._player_clan_position = -1;
    }
}

module.exports = User;