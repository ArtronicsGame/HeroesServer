class Match {
    constructor(matchID, playersIDs, HeroesProperties) {
        this._match_id = matchID;
        this._chain_of_actions = '';
        this._score_team_a = 0;
        this._score_team_b = 0;
        this._player_ids = playersIDs;
        this._heroes_properties = HeroesProperties;
        this._match_log;
    }

    
}

module.exports = Match;