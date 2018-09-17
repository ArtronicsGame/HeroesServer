const Match = require('./Match.js');
class MatchHub {
    constructor(userID, userHero, userIP, userPort) {
        this._users = [];
        this._heroes = [];
        this._users.push({_id : userID, _hero : userHero, _ip : userIP, _port : userPort});
        this._hero.push(userHero);
    }

    is_user_addable(userHero, callback) {
        if(!this._usersHero.includes(userHero))
            callback(true);
        else
            callback(false);
    }

    add_user(userID, userHero, userIP, userPort) {
        this._users.push({_id : userID, _hero : userHero, _ip : userIP, _port : userPort});
        this._hero.push(userHero);
    }

    is_completed() {
        return this._usersHero.length == 2
    }

    get_users_data(callback) {
        callback(this._users);
    }
    
}

module.exports = MatchHub;