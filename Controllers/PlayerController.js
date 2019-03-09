const User = require('../Models/User.js');
const MongoDB = require('../MongoDB.js');
const Utils = require("../Utils.js");
const DEBUG = require('../DEBUG.js')
const Player = module.exports = {};

Player.new = function (info, socket) {
    MongoDB.Users.new(info["username"], (registerState, newUserId) => {
        DEBUG.d({
            IP: socket.remoteAddress,
            Port: socket.remotePort,
            value: {
                username: info["username"],
                _id: newUserId.toString(),
                status: registerState
            }
        }, 'Player', 'New');

        socket.write(Utils.encodeTCP({
            _type: "NewPlayerResp",
            _info: {
                status: registerState,
                userId: newUserId.toString()
            }
        }));
    });
};

Player.get = function (info, socket) {
    MongoDB.Users.get(info["_id"], (getState, user) => {

        if (getState != STATUS_OK) {
            console.log(getState);
            return;
        }

        global.RedisDB.hset(info["_id"], "Trophies", user.trophies);
        global.RedisDB.hset(info["_id"], "CurrentHero", user.currentHero);
        global.RedisDB.hset(info["_id"], "PM_ID", PMID);
        global.OnlinePlayers.set(info["_id"], { socket: socket, udpInfo: null, data: user, match: null });
        global.SocketIds.set(socket, info["_id"]);

        DEBUG.d({
            IP: socket.remoteAddress,
            Port: socket.remotePort,
            Status: getState,
            value: user
        }, 'Player', 'Get');

        socket.write(Utils.encodeTCP({
            _type: "GetPlayerResp",
            _info: {
                status: getState,
                user: JSON.stringify(user)
            }
        }));
    });
};

Player.unlock = function (info, socket) {

}


