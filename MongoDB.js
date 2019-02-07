const Mongoose = require('mongoose');
const User = require('./Models/User.js');
const Clan = require('./Models/Clan.js');
const Message = require('./Models/Schema/Message.js')
const Utils = require('./Utils.js');

const MessageModel = Mongoose.model('Message', Message);

const MongoDB = module.exports = {};


MongoDB.begin = function () {
    var url = "mongodb://localhost:46620/HeroesDB";
    Mongoose.set('useCreateIndex', true)
    Mongoose.connect(url, { useNewUrlParser: true }).then(() => console.log("Mongo connected")).catch(err => console.error("Couldn't connect to MongoDB", err));

    //Test :
    // MongoDB.newUser("Hojat", function (a, b) { console.log(b); });
    // MongoDB.newClan("HojatClan", "5c5ad5c07543046a7ffd9dfb", function (a, b) { console.log(b) });
    // MongoDB.searchClan("A", function (a, b) { });
    // MongoDB.getUser("Mobin", function(res){console.log(res);});
    // MongoDB.getClan("5ba53d46c71a3316c2064fdb", function (res) { console.log(res); });
    // MongoDB.unlockHero("5c5ad5c07543046a7ffd9dfb", "IceMan", null);
    // MongoDB.joinToClan("5c5c3dd1359a2d0d644dc8c1", "5c5ad5d033b5826a91c401b8", function (a) { console.log(a) });
    // MongoDB.promote("5c5ad59f83a8db6a65c600ab", function (res) { console.log(res) });
    // MongoDB.addMessage("5c5ad59f83a8db6a65c600ab", "Hey", function (a) { console.log(a); });
}

MongoDB.newUser = function (username, callback) {
    User.create({ username: username }, function (err, res) {
        if (err) {
            console.log(err.message);
            if (err.message.includes("duplicate"))
                callback("UserDupName", "Null");
            return;
        }
        callback("RegOk", res._id);
    });
};

MongoDB.getUser = function (userId, callback) {
    User.findOne({ _id: userId }).populate('clan').exec(function (err, res) {
        if (err) {
            console.log(err.message);
            return;
        }
        callback("UserFound", res);
    })
};

MongoDB.getAllUsers = function (callback) {
    User.find().populate('clan').exec(function (err, res) {
        if (err) {
            console.log(err.message);
            return;
        }
        callback(res);
    })
};

MongoDB.newClan = function (clanName, leaderId, callback) {
    MongoDB.getUser(leaderId, function (status, leader) {
        if (!leader) {
            console.log(`User (${leaderId}) not found`);
            callback("UserNotFound", "Null");
            return;
        }
        if (leader.clan) {
            console.log(`${leaderId} already joined in a clan`);
            callback("AlreadyJoined", "Null");
            return;
        }
        Clan.create({ name: clanName, clanMembers: [leaderId], leader: leaderId }, function (err, clan) {
            if (err) {
                console.log(err.message);
                callback("Error", err.message);
                return;
            }
            leader.clan = clan._id;
            leader.playerClanPosition = "Leader";
            leader.save(function (err, res) {
                callback("ClanCraeted", clan._id.toString());
                console.log("Done");
            });
        })
    });
};

MongoDB.searchClan = function (clanName, callback) {
    Clan.find({ name: { "$regex": clanName, "$options": "i" } }).sort({ trophies: -1, name: 1 }).limit(100).exec(function (err, docs) {
        if (err) {
            console.log(err);
            return;
        }
        //docs = Utils.SwapArrayCells(docs); .slice(0, Math.min(9, docs.length))
        console.log(docs);
        callback("ClanSearchSuccess", JSON.parse(JSON.stringify(docs)));
    });
};

MongoDB.getClan = function (clanId, callback) {
    Clan.findOne({ _id: clanId }).populate({ path: 'clanMembers', populate: { path: 'clanMembers' } }).exec(function (err, clan) {
        if (err) {
            console.log(err);
            return;
        }
        callback(clan);
    });
};

MongoDB.unlockHero = function (userId, heroName, callback) {
    User.findOne({ _id: userId }, function (err, res) {
        if (err) {
            console.log(err.message);
            return;
        }
        res.heroesProperties.get(heroName).isUnlocked = true;
        if (res.currentHero == "None")
            res.currentHero = heroName;
        res.save();
        if (callback != null)
            callback();
    });
};

MongoDB.joinToClan = function (userId, clanId, callback) {
    MongoDB.getUser(userId, function (status, leader) {
        if (!leader) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }
        if (leader.clan) {
            console.log(`${userId} already joined in a clan`);
            callback("AlreadyJoined");
            return;
        }

        const userPromise = User.findOneAndUpdate({ _id: userId }, { clan: clanId, playerClanPosition: "Member" });
        const clanPromise = Clan.findOneAndUpdate({ _id: clanId }, { $addToSet: { clanMembers: userId } });

        Promise.all([userPromise, clanPromise])
            .then((result) => {
                callback("JoinOk");
            }).catch((err) => {
                console.log(err);
            });
    });
}

MongoDB.promote = function (promoterUserId, userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }
        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback("NoClan");
            return;
        }

        MongoDB.getUser(promoterUserId, function (status, promoteUser) {
            if (!promoterUser) {
                console.log(`User (${userId}) not found`);
                callback("PromoterUserNotFound");
                return;
            }
            if (!promoterUser.clan) {
                console.log(`${userId} do not joined in a clan`);
                callback("NoPromoterClan");
                return;
            }

            if ((promoteUser.playerClanPosition == "Leader" || promoteUser.playerClanPosition == "Co-Leader") && user.playerClanPosition == "Member") {
                user.playerClanPosition = "Co-Leader";
                user.save();

                // add message
                var message = `${promoteUser.username} promote ${user.username}`;
                MongoDB.addAdminMessage(promoterUser.clan, message, function (status) {
                    console.log(status);
                    console.log(`${promoterUserId} promote ${userId}`);
                });

                callback("PromoteOk");
            } else if (promoteUser.playerClanPosition == "Leader" && user.playerClanPosition == "Co-Leader") {
                MongoDB.getClan(user.clan, function (clan) {
                    var promotePromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "Leader" });
                    var demotePromise = User.findOneAndUpdate({ _id: clan.leader }, { playerClanPosition: "Co-Leader" });
                    var clanPromise = Clan.findOneAndUpdate({ _id: user.clan }, { leader: userId });

                    Promise.all([promotePromise, demotePromise, clanPromise])
                        .then((result) => {
                            callback("PromoteOk");
                        }).catch((err) => {
                            console.log(err);
                        });
                });
            } else {
                callback("PromoteNotAllowed");
            }
        });
    });
};

MongoDB.demote = function (UserId, userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }
        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback("NoClan");
            return;
        }

        MongoDB.getUser(UserId, function (status, demoterUser) {
            if (!demoterUser) {
                console.log(`User (${userId}) not found`);
                callback("UserNotFound");
                return;
            }
            if (!demoterUser.clan) {
                console.log(`${userId} do not joined in a clan`);
                callback("NoClan");
                return;
            }

            if (demoterUser.playerClanPosition == "Leader" && user.playerClanPosition == "Co-Leader") {
                user.playerClanPosition = "Member";
                user.save();

                // add message
                var message = `${demoterUser.username} demote ${user.username}`;
                MongoDB.addAdminMessage(demoterUser.clan, message, function (status) {
                    console.log(status);
                    console.log(`${demoterUserId} demote ${userId}`);
                });

                callback("DemoteOk");
            } else {
                callback("DemoteNotAllowed");
            }
        });
    });
};

MongoDB.addMessage = function (userId, msg, callback) {
    User.findOne({ _id: userId }).exec(function (err, user) {
        if (err) {
            console.log(err);
            return;
        }
        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback("NoClan");
            return;
        }

        var message = new MessageModel({
            senderID: userId,
            context: msg
        });

        Clan.findOneAndUpdate({ _id: user.clan }, { $push: { messages: message } }).exec(function (err, res) {
            callback("Sent");
        });
    });
}

MongoDB.addAdminMessage = function (clanId, msg, callback) {
    Clan.findOne({ _id: clanId }).exec(function (err, clan) {
        if (err) {
            console.log(err);
            return;
        }
        if (clan) {
            console.log(`${userId} do not joined in a clan`);
            callback("NoClan");
            return;
        }

        var message = new MessageModel({
            senderID: null,
            context: msg
        });

        if (clan.messages.length < 999) {
            clan.messages.push(message);
            callback("sent");
        } else {
            var addMessagePromise = clan.messages.push(message);
            var removeMessagePromise = clan.messages.pop(-1);
            Promise.all([addMessagePromise, removeMessagePromise])
                .then((result) => {
                    callback("sent");
                }).catch((err) => {
                    console.log(err);
                });
        }
    });
}


MongoDB.kickFromClan = function (kickerUserId, userId) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }
        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback("NoClan");
            return;
        }

        MongoDB.getUser(kickerUserId, function (status, kickerUser) {
            if (!kickerUser) {
                console.log(`User (${kickerUser}) not found`);
                callback("KickerUserNotFound");
                return;
            }
            if (!kickerUser.clan) {
                console.log(`${kickerUserId} do not joined in a clan`);
                callback("NoKickerClan");
                return;
            }

            if ((kickerUser.playerClanPosition == "Leader" && (user.playerClanPosition == "Co-Leader" || user.playerClanPosition == "Member")) ||
                (kickerUser.playerClanPosition == "Co-Leader" && user.playerClanPosition == "Member")) {

                MongoDB.getClan(user.clan, function (clan) {
                    var index = clan.clanMembers.indexOf(userId);

                    var clanPositionPromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "None" });
                    var userclanPromise = User.findOneAndUpdate({ _id: userId }, { clan: null });
                    var clanPromise = Clan.findOneAndUpdate({ _id: userId.clan }, { $splice: { clanMembers: (index, 1) } });

                    Promise.all([clanPositionPromise, userclanPromise, clanPromise])
                        .then((result) => {
                            user.save();
                            callback("KickOk");
                        }).catch((err) => {
                            console.log(err);
                        });
                });
            } else {
                callback("KickNotAllowed");
            }
        });
    });
}

MongoDB.leaveFromClan = function (userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }
        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback("NoClan");
            return;
        }

        user.playerClanPosition = "None";
        user.clan = null;
        callback("KickOk");
    });
}

// MongoDB.begin();
