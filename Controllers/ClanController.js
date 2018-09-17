const Clans = module.exports = {};
const Clan = require('../Models/Clan.js');

Clans.new = function(info, rinfo) {
    var newClan = new Clan(info["_name"], info["_leader"])
    mongoDB.process("add_clan", newClan, function (add_clan_state, clan_id) {
        global.send_response("add_clan", add_clan_state, clan_id, rinfo);
    })
}

Clan.search = function(info, rinfo) {
    mongoDB.process("search_clan", info, function (search_clan_result) {
        global.send_response("search_clan", search_clan_result, rinfo);
    })
}