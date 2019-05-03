const Clans = module.exports = {};

Clans.new = function (info, socket) {
    MongoDB.newClan(info["clanName"], info["leaderId"], (newClanState, newClanId) => socket.write(JSON.stringify({
        _type: "NewClanResp",
        _info: {
            status: newClanState,
            clanId: newClanId
        }
    })));
}

Clans.search = function (info, socket) {
    MongoDB.searchClan(info['clanName'], (searchClanStatus, searchClanResult) => socket.write(JSON.stringify({
        _type: "ClanSearchResp",
        _info: {
            status: searchClanStatus,
            clans: searchClanResult
        }
    })));
}