const Match = require('./Models/Match.js');
class MatchHub {
    constructor(info, rinfo) {
        this._users = [];
        this._heroes = [];
        this._users.push({_info : info, _rinfo : rinfo});
        this._hero.push(info["_hero"]);
    }

    is_user_addable(userHero, callback) {
        if(!this._usersHero.includes(userHero))
            callback(true);
        else
            callback(false);
    }

    add_user(info, rinfo) {
        this._users.forEach(user => { 
            global.send_response("addUserToMatch", info, user["_rinfo"]); // send user data to another players
            global.send_response("addUserToMatch", user["_info"], rinfo); // sent another players data to user
        });
        this._users.push({_info : info, _rinfo : rinfo});
        this._hero.push(userHero);
    }

    is_completed() {
        return this._usersHero.length == 2
    }

    get_users_data(callback) {
        callback(this._users);
    }

    start_match() {
        //TODO
    }
    
}

module.exports = MatchHub;