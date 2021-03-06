const DEBUG = require('../DEBUG.js')
const Player = module.exports = {};

Player.new = function (info, socket) {
    MongoDB.Users.new(info["username"], (registerState, newUserId) => {

        if (registerState == STATUS_OK) {
            DEBUG.d({
                IP: socket.remoteAddress,
                Port: socket.remotePort,
                value: {
                    username: info["username"],
                    _id: newUserId.toString(),
                    status: registerState
                }
            }, 'Player', 'New');

            socket.write(JSON.stringify({
                _type: "NewPlayerResp",
                _info: {
                    status: registerState,
                    userId: newUserId.toString()
                }
            }) + "\n");
        }
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
        global.RedisDB.hset(info["_id"], "Port", DEDICATED_PORT);
        global.OnlinePlayers.set(info["_id"], {
            socket: socket,
            data: user,
            match: null
        });
        global.SocketIds.set(socket, info["_id"]);

        DEBUG.d({
            IP: socket.remoteAddress,
            Port: socket.remotePort,
            Status: getState,
            value: user
        }, 'Player', 'Get');

        socket.write(JSON.stringify({
            _type: "GetPlayerResp",
            _info: {
                status: getState,
                user: JSON.stringify(user)
            }
        }) + "\n");
    });
};

Player.unlock = function (info, socket) {

}