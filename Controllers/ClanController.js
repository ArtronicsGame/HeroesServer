const Clans = module.exports = {};
const Clan = require('../Models/Clan.js');
const MongoDB = require('../MongoDB.js');
const Utils = require("../Utils.js");

Clans.new = function (info, socket) {
    MongoDB.newClan(info["clanName"], info["leaderId"], (newClanState, newClanId) => socket.write(Utils.encodeTCP({
        _type: "NewClanResp",
        _info: {
            status: newClanState,
            clanId: newClanId
        }
    })));
}

Clans.search = function (info, socket) {
    MongoDB.searchClan(info['clanName'], (searchClanStatus, searchClanResult) => socket.write(Utils.encodeTCP({
        _type: "ClanSearchResp",
        _info: {
            status: searchClanStatus,
            clans: searchClanResult
        }
    })));
}