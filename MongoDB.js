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
    // MongoDB.promote("5c5ad59f83a8db6a65c600ab", "5c5ad5c07543046a7ffd9dfb", function (res) { console.log(res) });
    // MongoDB.demote("5c5ad59f83a8db6a65c600ab", "5c5c3dd1359a2d0d644dc8c1", function (res) { console.log(res) });
    // MongoDB.kickFromClan("5c5ad59f83a8db6a65c600ab", "5c5c3dd1359a2d0d644dc8c1", function (res) { console.log(res) });
    // MongoDB.addMessage("5c5ad59f83a8db6a65c600ab", "Hey", function (a) { console.log(a); });
    // MongoDB.leaveFromClan("5c5c3dd1359a2d0d644dc8c1", function (a) { console.log(a); });
    // MongoDB.changeDescription("5c5ad5c07543046a7ffd9dfb", "FuckYouMobin", function (a) { console.log(a); });
    // MongoDB.addReply("5c5ad59f83a8db6a65c600ab", "Hey", "BokhoreshMobin", function (a) { console.log(a); });
    // MongoDB.changeHero("5c5ad5c07543046a7ffd9dfb", "Tank", function (a) { console.log(a); });
    // MongoDB.addHeroTrophies("5c5ad5c07543046a7ffd9dfb", "Tank", 1000, function (a) { console.log(a); });
    // MongoDB.addHeroXP("5c5ad5c07543046a7ffd9dfb", "Tank", 1000, function (a) { console.log(a); });
    // MongoDB.addCoins("5c5ad5c07543046a7ffd9dfb", 1000, function (a) { console.log(a); });
    // MongoDB.levelUpHero("5c5ad5c07543046a7ffd9dfb", "Tank", function (a) { console.log(a); });
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
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }
        if (user.clan) {
            console.log(`${userId} already joined in a clan`);
            callback("AlreadyJoined");
            return;
        }

        const userPromise = User.findOneAndUpdate({ _id: userId }, { clan: clanId, playerClanPosition: "Member" });
        const clanPromise = Clan.findOneAndUpdate({ _id: clanId }, { $addToSet: { clanMembers: userId } });

        Promise.all([userPromise, clanPromise])
            .then((result) => {
                // add message
                var message = `${user.username} joined to this clan`;
                MongoDB.addAdminMessage(clanId, message, function (status) {
                    console.log(status);
                    console.log(`${userId} joined to this clan`);
                });

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

        MongoDB.getUser(promoterUserId, function (status, promoterUser) {
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

            if ((promoterUser.playerClanPosition == "Leader" || promoterUser.playerClanPosition == "Co-Leader") && user.playerClanPosition == "Member") {
                user.playerClanPosition = "Co-Leader";
                user.save();

                // add message
                var message = `${promoterUser.username} promote ${user.username}`;
                MongoDB.addAdminMessage(promoterUser.clan, message, function (status) {
                    console.log(status);
                    console.log(`${promoterUserId} promote ${userId}`);
                });

                callback("PromoteOk");
            } else if (promoterUser.playerClanPosition == "Leader" && user.playerClanPosition == "Co-Leader") {
                MongoDB.getClan(user.clan, function (clan) {
                    var promotePromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "Leader" });
                    var demotePromise = User.findOneAndUpdate({ _id: clan.leader }, { playerClanPosition: "Co-Leader" });
                    var clanPromise = Clan.findOneAndUpdate({ _id: user.clan }, { leader: userId });

                    Promise.all([promotePromise, demotePromise, clanPromise])
                        .then((result) => {
                            // add message
                            var message = `${promoterUser.username} promote ${user.username}`;
                            MongoDB.addAdminMessage(promoterUser.clan, message, function (status) {
                                console.log(status);
                                console.log(`${promoterUserId} promote ${userId}`);
                            });

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

MongoDB.demote = function (demoterUserId, userId, callback) {
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

        MongoDB.getUser(demoterUserId, function (status, demoterUser) {
            if (!demoterUser) {
                console.log(`User (${demoterUserId}) not found`);
                callback("UserNotFound");
                return;
            }
            if (!demoterUser.clan) {
                console.log(`${demoterUserId} do not joined in a clan`);
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

        Clan.findOne({ _id: user.clan }).exec(function (err, clan) {
            if (err) {
                console.log(err);
                return;
            }
            if (!clan) {
                callback("NoClan");
                return;
            }

            if (clan.messages.length < 999) {
                clan.messages.push(message);
                clan.save();
                callback("Sent");
            } else {
                var addMessagePromise = clan.messages.push(message);
                var removeMessagePromise = clan.messages.shift();
                Promise.all([addMessagePromise, removeMessagePromise])
                    .then((result) => {
                        callback("Sent");
                    }).catch((err) => {
                        console.log(err);
                    });
            }
        });
    });
}

MongoDB.addReply = function (userId, repliedMsg, msg, callback) {
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
            replyMessage: repliedMsg,
            senderID: userId,
            context: msg
        });

        Clan.findOne({ _id: user.clan }).exec(function (err, clan) {
            if (err) {
                console.log(err);
                return;
            }
            if (!clan) {
                callback("NoClan");
                return;
            }

            if (clan.messages.length < 999) {
                clan.messages.push(message);
                clan.save();
                callback("Sent");
            } else {
                var addMessagePromise = clan.messages.push(message);
                var removeMessagePromise = clan.messages.shift();
                Promise.all([addMessagePromise, removeMessagePromise])
                    .then((result) => {
                        callback("Sent & Remove");
                    }).catch((err) => {
                        console.log(err);
                    });
            }
        });
    });
}

MongoDB.addAdminMessage = function (clanId, msg, callback) {
    Clan.findOne({ _id: clanId }).exec(function (err, clan) {
        if (err) {
            console.log(err);
            return;
        }
        if (!clan) {
            callback("NoClan");
            return;
        }

        var message = new MessageModel({
            senderID: null,
            context: msg
        });

        if (clan.messages.length < 999) {
            clan.messages.push(message);
            clan.save();
            callback("Sent");
        } else {
            var addMessagePromise = clan.messages.push(message);
            var removeMessagePromise = clan.messages.shift();
            Promise.all([removeMessagePromise, addMessagePromise])
                .then((result) => {
                    clan.save();
                    callback("Sent & Remove");
                }).catch((err) => {
                    console.log(err);
                });
        }
    });
}


MongoDB.kickFromClan = function (kickerUserId, userId, callback) {
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
                    var clanPromise = Clan.findOneAndUpdate({ _id: user.clan }, { $pull: { clanMembers: user._id } });

                    Promise.all([clanPositionPromise, userclanPromise, clanPromise])
                        .then((result) => {
                            // add message
                            var message = `${kickerUser.username} kcik ${user.username}`;
                            MongoDB.addAdminMessage(kickerUser.clan, message, function (status) {
                                console.log(status);
                                console.log(`${kickerUserId} kcik ${userId}`);
                            });

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

        var clanId = user.clan;
        var clanPositionPromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "None" });
        var userclanPromise = User.findOneAndUpdate({ _id: userId }, { clan: null });
        var clanPromise = Clan.findOneAndUpdate({ _id: user.clan }, { $pull: { clanMembers: user._id } });
        Promise.all([clanPositionPromise, clanPromise, userclanPromise])
            .then((result) => {
                // add message
                var message = `${user.username} leave from clan`;
                MongoDB.addAdminMessage(clanId, message, function (status) {
                    console.log(status);
                    console.log(`${userId} leave from clan`);
                });

                callback("LeaveOk");
            }).catch((err) => {
                console.log(err);
            });
    });
}

MongoDB.changeDescription = function (userId, description, callback) {
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

        if (user.playerClanPosition == "Leader" || user.playerClanPosition == "Co-Leader") {
            Clan.findOne({ _id: user.clan }).exec(function (err, clan) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (!clan) {
                    callback("NoClan");
                    return;
                }

                clan.description = description;
                clan.save();
                callback("ChangeOk");
            });
        } else {
            callback("ChangeNotAllowed");
        }
    });
}

MongoDB.changeHero = function (userId, hero, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`hero ${hero} is lock for (${userId})`);
            callback("ChangeNotAllowed");
            return;
        }

        user.currentHero = hero;
        user.save();
        callback("ChangeOk");
    });
}

MongoDB.addHeroTrophies = function (userId, hero, amount, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`hero ${hero} is lock for (${userId})`);
            callback("HeroLock");
            return;
        }

        user.heroesProperties.get(hero).trophies += amount;
        user.save();
        callback("TrophyAdded");
    });
}

MongoDB.addHeroXP = function (userId, hero, amount, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`hero ${hero} is lock for (${userId})`);
            callback("HeroLock");
            return;
        }

        user.heroesProperties.get(hero).experience += amount;
        user.save();
        callback("XPAdded");
    });
}

MongoDB.addCoins = function (userId, amount, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }

        user.coins += amount;
        user.save();
        callback("CoinsAdded");
    });
}

MongoDB.levelUpHero = function (userId, hero, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (!user) {
            console.log(`User (${userId}) not found`);
            callback("UserNotFound");
            return;
        }

        user.heroesProperties.get(hero).basicInfo.level ++;
        user.save();
        callback("LevelUpOk");
    });
}

// MongoDB.begin();
