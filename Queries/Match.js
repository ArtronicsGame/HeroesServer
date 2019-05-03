const Mongoose = require('mongoose');
const User = require('../Models/User.js');
const Clan = require('../Models/Clan.js');
const Match = require('../Models/Match.js');
const Message = require('../Models/Schema/Message.js')
const Utils = require('../Utils.js');
const MessageModel = Mongoose.model('Message', Message);

const MatchDB = module.exports = {};

MatchDB.new = function (userIds, serverIP, serverPort, callback) {
    Match.create({
        matchIP: serverIP,
        matchPort: serverPort,
        playerIds: userIds
    }, function (err, res) {
        if (err)
            callback(STATUS_FAILED);
        callback(STATUS_OK, res._id);
        for (var i = 0; i < userIds.length; i++) {
            MongoDB.Users.joinMatch(userIds[i], res._id);
        }
    });
};

MatchDB.result = function (matchId, actions) {
    Match.findByIdAndUpdate(matchId, {
        actions: actions,
        isRunning: false
    }).exec();
}