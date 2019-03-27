const Match = module.exports = {};
const MatchHub = require('../MatchHub.js');
const DEBUG = require('../DEBUG.js')
const UniId = require('uniqid');

const RouteData = new Map();

Match.updatePos = function (info, rinfo) {
    //TODO: Implement Moving By UDP Connection
};

Match.action = function (info, socket) {
    //TODO: Implement Actions By TCP Connection
}

Match.tcpHandshake = function (info, socket) {
    var matchId = info['matchId'];
    var id = info['id'];

    global.Matches.get(matchId.toString()).tcpHandshake(id, socket);
}

Match.udpHandshake = function (info, rinfo) {
    var matchId = info['matchId'];
    var id = info['id'];
    RouteData.set(rinfo.address + ":" + rinfo.port.toString(), matchId.toString());
    global.Matches.get(matchId.toString()).udpHandshake(id, rinfo);
}

Match.route = function (data, rdata) {
    var id = RouteData.get(rdata);
    global.Matches.get(id).onPacket(data);
}

