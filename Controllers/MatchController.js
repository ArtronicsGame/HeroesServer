const Match = module.exports = {};
const MatchHub = require('../Models/MatchHub.js');

Match.loby = [];

Match.updatePos = function() {
};

Match.new = function(info, rinfo) { //info contains id, hero, items
    var userHero = info["_user_hero"];
    var added = false;
    loby.forEach(matchHub => {
        matchHub.is_user_addable(userHero, function(isAddable) {
            if (isAddable) {
                matcheHub.add_user(info, rinfo);
                if (matchHub.is_completed()) { //startMatch
                    loby.splice(matchHub);
                    matchHub.start_match();
                }
                added = true;
            }
        });
    });
    if(added == false) {
        var matchHub = new MatchHub(info, rinfo);
        loby.push(matchHub)
    }
};