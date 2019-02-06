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
    // MongoDB.joinToClan("5c5ad59f83a8db6a65c600ab", "5c5ad5d033b5826a91c401b8", function (a) { console.log(a) });
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

MongoDB.promote = function (userId, callback) {
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

        if (user.playerClanPosition == "Member") {
            user.playerClanPosition = "Co-Leader";
            user.save();
            callback("PromoteOk");
        } else if (user.playerClanPosition == "Co-Leader") {
            user.playerClanPosition = "Co-Leader";

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
};

MongoDB.demote = function (userId, callback) {
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

        if (user.playerClanPosition == "Co-Leader") {
            user.playerClanPosition = "Member";
            user.save();
            callback("DemoteOk");
        } else {
            callback("DemoteNotAllowed");
        }
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

// MongoDB.begin();
