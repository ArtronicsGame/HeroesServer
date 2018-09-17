const User = require('../Models/User.js');
const MongoDB = require('../MongoDB.js');
const Player = module.exports = {};

Player.new = function(info, rinfo) { 
    var newUser = new User(info["_username"]);
    MongoDB.process("newUser", newUser, function(registerState, userId) {
        global.send_response("register_state", {"_state" : registerState, "_id" : userId}, rinfo);
    });
};

