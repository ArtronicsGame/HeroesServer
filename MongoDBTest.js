const Mongoose = require('mongoose');
const User = require('./Models/User.js');
const Clan = require('./Models/Clan.js');
const Message = require('./Models/Schema/Message.js')
const Utils = require('./Utils.js');

const MessageModel = Mongoose.model('Message', Message);

global.STATUS_OK = 200;
global.STATUS_TIMEOUT = 504;
global.STATUS_UNAUTHORIZED = 401;
global.STATUS_NOT_FOUND = 404;
global.STATUS_DUPLICATE = 409;
global.STATUS_FAILED = 500;
global.STATUS_NOT_PERMITTED = 400;
global.HEROES = ["IceMan", "BlackHole", "Healer", "Tank", "Wizard", "Cloner", "Invoker", "ClockMan"];


const MongoDB = module.exports = {};


MongoDB.begin = function () {
    var url = "mongodb://localhost:46620/HeroesDB";
    Mongoose.set('useCreateIndex', true)
    Mongoose.connect(url, { useNewUrlParser: true }).then(() => console.log("Mongo connected")).catch(err => console.error("Couldn't connect to MongoDB", err));

    //Test :
    // MongoDB.newUser("Ali", function (a, b) { console.log(a + "\n" + b); });
    // MongoDB.newClan("HojatClan2", "5c61dbadf6e2ce5929423572", function (a, b) { console.log(b) });
    // MongoDB.searchClan("o", function (a, b) { });
    // MongoDB.getUser("5c61dbadf6e2ce5929423572", function(res, user){console.log(res + "\n" + user);});
    // MongoDB.getClan("5c61dd798f56b259a4bc80a5", function (res) { console.log(res); });
    // MongoDB.unlockHero("5c61dbadf6e2ce5929423572", "Tank", function (res) { console.log(res); });
    // MongoDB.joinToClan("5c61dc079947865945e78eb0", "5c61dd798f56b259a4bc80a5", function (a) { console.log(a) });
    // MongoDB.promote("5c61dbadf6e2ce5929423572", "5c61dbadf6e2ce5929423572", function (res) { console.log(res) });
    // MongoDB.demote("5c61dc079947865945e78eb0", "5c61dbadf6e2ce5929423572", function (res) { console.log(res) });
    // MongoDB.kickFromClan("5c61dbf97af24959392825fb", "5c61dbadf6e2ce5929423572", function (res) { console.log(res) });
    // MongoDB.leaveFromClan("5c61dbf97af24959392825fb", function (a) { console.log(a); });
    // MongoDB.changeDescription("5c61dbadf6e2ce5929423572", "FuckYouMobin", function (a) { console.log(a); });
    // MongoDB.addMessage("5c61dbadf6e2ce5929423572", "Hey", function (a) { console.log(a); });
    // MongoDB.addReply("5c61dbadf6e2ce5929423572", "Hey", "BokhoreshMobin", function (a) { console.log(a); });
    // MongoDB.changeHero("5c61dbadf6e2ce5929423572", "Tank", function (a) { console.log(a); });
    // MongoDB.addHeroTrophies("5c61dbadf6e2ce5929423572", "IceMan", 200, function (a) { console.log(a); });
    // MongoDB.addHeroXP("5c61dbadf6e2ce5929423572", "IceMan", 1000, function (a) { console.log(a); });
    // MongoDB.addCoins("5c61dbadf6e2ce5929423572", 1000, function (a) { console.log(a); });
    // MongoDB.levelUpHero("5c61dbadf6e2ce5929423572", "Tank", function (a) { console.log(a); });
}

/*================================================= System Queries =================================================*/

MongoDB.getUser = function (userId, callback) {
    User.findOne({ _id: userId }).populate('clan').exec(function (err, res) {
        if (err) {
            console.log(err.message);
            callback(STATUS_FAILED);
            return;
        }
        if(!res) {
            console.log(`User (${userId}) not found`);
            callback(STATUS_NOT_FOUND);
            return;
        }
        callback(STATUS_OK, res);
    })
};

MongoDB.getAllUsers = function (callback) {
    User.find().populate('clan').exec(function (err, res) {
        if (err) {
            console.log(err.message);
            callback(STATUS_FAILED)
            return;
        }
        callback(STATUS_OK, res);
    })
};

MongoDB.getClan = function (clanId, callback) {
    Clan.findOne({ _id: clanId }).populate({ path: 'clanMembers', populate: { path: 'clanMembers' } }).exec(function (err, clan) {
        if (err) {
            console.log(err);
            callback(STATUS_FAILED)
            return;
        }
        if (!clan) {
            console.log(`Clan (${clanId}) not found`);
            callback(STATUS_NOT_FOUND);
            return;
        }
        callback(STATUS_OK, clan);
    });
};

MongoDB.addHeroTrophies = function (userId, hero, amount, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!HEROES.includes(hero)) {
            console.log(`There is no such hero (${hero})`);
            callback(STATUS_FAILED);
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`Hero (${hero}) is lock for (${userId})`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        var newTrophies = user.heroesProperties.get(hero).trophies + amount;
        user.heroesProperties.get(hero).trophies = newTrophies;
        user.save(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            }

            MongoDB.updateUserTrphies(user, function (status, newUserTrophies) {
                if (status != STATUS_OK) {
                    callback(STATUS_FAILED);
                    return;
                }
                callback(STATUS_OK, newTrophies);
            });
        });
    });
}

MongoDB.addHeroXP = function (userId, hero, amount, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!HEROES.includes(hero)) {
            console.log(`There is no such hero (${hero})`);
            callback(STATUS_FAILED);
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`hero ${hero} is lock for (${userId})`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        var newXP = user.heroesProperties.get(hero).experience + amount;
        user.heroesProperties.get(hero).experience = newXP;
        user.save(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            }
            callback(STATUS_OK, newXP);
        });
    });
}

MongoDB.addCoins = function (userId, amount, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        var newCoin = user.coins + amount;
        user.coins = newCoin;
        user.save(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            }
            callback(STATUS_OK, newCoin);
        });
    });
}

MongoDB.levelUpHero = function (userId, hero, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!HEROES.includes(hero)) {
            console.log(`There is no such hero (${hero})`);
            callback(STATUS_FAILED);
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`hero ${hero} is lock for (${userId})`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        var newLevel = ++ user.heroesProperties.get(hero).basicInfo.level;
        user.save(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            } else {
                callback(STATUS_OK, newLevel);
            }
        });
    });
}

MongoDB.updateUserTrphies = function (userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        var trophies = [];
        HEROES.forEach(function (hero) {
            trophies.push(user.heroesProperties.get(hero).trophies);
        });
        trophies.sort(function(a, b) {
            return b - a;
        });

        var newTrophies = trophies[0] + 0.75 * trophies[1] + 0.5 * trophies[2] + 0.25 * trophies[3];
        user.trophies = newTrophies;
        user.save(function (err, res) {
            if (err) {
                console.log(`User (${userId}) trophies didn't update!`);
                callback(STATUS_FAILED);
                return;
            }
            
            console.log(`User (${user._id}) update trophies: ${newTrophies}`);
            if(user.clan) {
                MongoDB.updateClanTrphies(user.clan, function(status, newClanTrophies) {
                    callback(status);
                });
            } else {
                callback(STATUS_OK, newTrophies); 
            }
        });
    });
}

MongoDB.updateClanTrphies = function (clanId, callback) {
    MongoDB.getClan(clanId, function(status, clan) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        var trophies = [];
        clan.clanMembers.forEach(function(user) {
            trophies.push(user.trophies);
        });
        trophies.sort(function(a, b) {
            return b - a;
        });
        
        var newTrophies = 0;
        for(var i=0; i<clan.clanMembers.length; i++)
            if(i/10 == 0)
                newTrophies += trophies[i];
            else if(i/10 == 1)
                newTrophies += 0.75 * trophies[i];
            else
                newTrophies += 0.5 * trophies[i];
        clan.trophies = newTrophies;
        clan.save(function (err, res) {
            if (err) {
                console.log(`Clan (${clan._id}) trophies didn't update!`);
                callback(STATUS_FAILED);
                return;
            } else {
                console.log(`Clan (${clan._id}) update trophies: ${newTrophies}`);
                callback(STATUS_OK, newTrophies);
            }
        });
    });
}

/*================================================= User Queries =================================================*/

MongoDB.newUser = function (username, callback) {
    User.create({ username: username }, function (err, res) {
        if (err) {
            console.log(err.message);
            if (err.message.includes("duplicate"))
                callback(STATUS_DUPLICATE);
            else
                callback(STATUS_FAILED);
            return;
        }
        callback(STATUS_OK, res._id);
    });
};

MongoDB.unlockHero = function (userId, hero, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!HEROES.includes(hero)) {
            console.log(`There is no such hero (${hero})`);
            callback(STATUS_FAILED);
            return;
        }

        user.heroesProperties.get(hero).isUnlocked = true;
        if (user.currentHero == "None")
            user.currentHero = hero;
        user.save(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            }
            callback(STATUS_OK);
        });
    });
};

MongoDB.joinToClan = function (userId, clanId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (user.clan) {
            console.log(`${userId} already joined in a clan`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        MongoDB.getClan(clanId, function(status, clan) {
            if (status != STATUS_OK) {
                callback(STATUS_FAILED);
                return;
            }

            const userPromise = User.findOneAndUpdate({ _id: userId }, { clan: clanId, playerClanPosition: "Member" });
            const clanPromise = Clan.findOneAndUpdate({ _id: clanId }, { $addToSet: { clanMembers: userId } });

            Promise.all([userPromise, clanPromise])
                .then((result) => {
                    var message = `${user.username} joined to this clan`;
                    MongoDB.addAdminMessage(clan, message, function (status) {
                        if (status != STATUS_OK) {
                            console.log("Message didn't sent!");
                            callback(STATUS_FAILED);
                            return;
                        }
                        console.log(`${userId} joined to this clan`);
                    });
                    
                    MongoDB.updateClanTrphies(clan, function (status, newTrophies) {
                        if (status != STATUS_OK) {
                            console.log(`Clan ${clanId} trophies didn't update`);
                            callback(STATUS_FAILED);
                            return;
                        }
                        callback(STATUS_OK);
                    });
                }).catch((err) => {
                    console.log(err);
                    callback(STATUS_FAILED);
                });
        });
    });
}

MongoDB.changeHero = function (userId, hero, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!HEROES.includes(hero)) {
            console.log(`There is no such hero (${hero})`);
            callback(STATUS_FAILED);
            return;
        }

        if (!user.heroesProperties.get(hero).isUnlocked) {
            console.log(`hero ${hero} is lock for (${userId})`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        user.currentHero = hero;
        user.save(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            }
            callback(STATUS_OK);
        });
    });
}

/*================================================= Clan Queries =================================================*/

MongoDB.newClan = function (clanName, leaderId, callback) {
    MongoDB.getUser(leaderId, function (status, leader) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }
        
        if (leader.clan) {
            console.log(`${leaderId} already joined in a clan`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        Clan.create({ name: clanName, clanMembers: [leaderId], leader: leaderId }, function (err, clan) {
            if (err) {
                console.log(err.message);
                callback(STATUS_FAILED, err.message);
                return;
            }

            leader.clan = clan._id;
            leader.playerClanPosition = "Leader";          
            leader.save(function (err, res) {
                if (err) {
                    callback(STATUS_FAILED);
                    return;
                }

                console.log(`User (${leaderId} create clan (${clan._id}))`);
                
                var message = `${leader.username} create this clan`;
                MongoDB.addAdminMessage(clan, message, function (status) {
                    if (status != STATUS_OK) {
                        callback(STATUS_FAILED);
                        return;
                    }

                    MongoDB.updateClanTrphies(clan, function(status) {
                        if (status != STATUS_OK) {
                            callback(STATUS_FAILED);
                            return;
                        }
                        callback(STATUS_OK, clan._id.toString());
                    });
                });
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
        callback(STATUS_OK, JSON.parse(JSON.stringify(docs)));
    });
};

MongoDB.destroyClan = function (clanId, callback) {
    MongoDB.getClan(clanId, function (status, clan) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        clan.remove(function (err, res) {
            if (err) {
                callback(STATUS_FAILED);
                return;
            }
            console.log(`Clan ${clanId} has been removed`);
            callback(STATUS_OK);
        });
    });
}

MongoDB.promote = function (promoterUserId, userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        MongoDB.getUser(promoterUserId, function (status, promoterUser) {
            if (status != STATUS_OK) {
                callback(STATUS_FAILED);
                return;
            }

            if (!promoterUser.clan) {
                console.log(`${userId} do not joined in a clan`);
                callback(STATUS_NOT_FOUND);
                return;
            }

            if ((promoterUser.playerClanPosition == "Leader" || promoterUser.playerClanPosition == "Co-Leader") && user.playerClanPosition == "Member") {
                user.playerClanPosition = "Co-Leader";
                user.save(function (err, res) {
                    if (err) {
                        callback(STATUS_FAILED);
                        return;
                    }

                    var message = `${promoterUser.username} promote ${user.username}`;
                    MongoDB.addAdminMessage(promoterUser.clan, message, function (status) {
                        if (status != STATUS_OK) {
                            callback(STATUS_FAILED);
                            return;
                        }

                        console.log(`${promoterUserId} promote ${userId}`);
                        callback(STATUS_OK);
                        return;
                    });
                });
            } else if (promoterUser.playerClanPosition == "Leader" && user.playerClanPosition == "Co-Leader") {
                var promotePromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "Leader" });
                var demotePromise = User.findOneAndUpdate({ _id: user.clan.leader }, { playerClanPosition: "Co-Leader" });
                var clanPromise = Clan.findOneAndUpdate({ _id: user.clan }, { leader: userId });

                Promise.all([promotePromise, demotePromise, clanPromise])
                    .then((result) => {
                        var message = `${promoterUser.username} promote ${user.username}`;
                        MongoDB.addAdminMessage(promoterUser.clan, message, function (status) {
                            if (status != STATUS_OK) {
                                callback(STATUS_FAILED);
                                return;
                            }
                            console.log(`${promoterUserId} promote ${userId}`);
                            callback(STATUS_OK);
                        });
                    }).catch((err) => {
                        console.log(err);
                        callback(STATUS_FAILED);
                        return;
                    });
            } else {
                callback(STATUS_NOT_PERMITTED);
            }
        });
    });
};

MongoDB.demote = function (demoterUserId, userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        MongoDB.getUser(demoterUserId, function (status, demoterUser) {
            if (status != STATUS_OK) {
                callback(STATUS_FAILED);
                return;
            }

            if (!demoterUser.clan) {
                console.log(`${demoterUserId} do not joined in a clan`);
                callback(STATUS_NOT_FOUND);
                return;
            }

            if (demoterUser.playerClanPosition == "Leader" && user.playerClanPosition == "Co-Leader") {
                user.playerClanPosition = "Member";
                user.save(function (err, res) {
                    if (err) {
                        callback(STATUS_FAILED);
                        return;
                    }
                    
                    var message = `${demoterUser.username} demote ${user.username}`;
                    MongoDB.addAdminMessage(demoterUser.clan, message, function (status) {
                        if (status != STATUS_OK) {
                            callback(STATUS_FAILED);
                            return;
                        }
                            
                        console.log(`${demoterUserId} demote ${userId}`);
                        callback(STATUS_OK);
                    });
                });
            } else {
                callback(STATUS_NOT_PERMITTED);
            }
        });
    });
};

MongoDB.kickFromClan = function (kickerUserId, userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        MongoDB.getUser(kickerUserId, function (status, kickerUser) {
           if (status != STATUS_OK) {
                callback(STATUS_FAILED);
                return;
            }

            if (!kickerUser.clan) {
                console.log(`${kickerUserId} do not joined in a clan`);
                callback(STATUS_NOT_FOUND);
                return;
            }

            if ((kickerUser.playerClanPosition == "Leader" && (user.playerClanPosition == "Co-Leader" || user.playerClanPosition == "Member")) ||
                (kickerUser.playerClanPosition == "Co-Leader" && user.playerClanPosition == "Member")) {
                    
                var clanPositionPromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "None" });
                var userclanPromise = User.findOneAndUpdate({ _id: userId }, { clan: null });
                var clanPromise = Clan.findOneAndUpdate({ _id: user.clan }, { $pull: { clanMembers: user._id } });

                Promise.all([clanPositionPromise, userclanPromise, clanPromise])
                    .then((result) => {
                        var message = `${kickerUser.username} kick ${user.username}`;
                        MongoDB.addAdminMessage(kickerUser.clan, message, function (status) {
                            if (status != STATUS_OK) {
                                callback(STATUS_FAILED);
                                return;
                            }
                            
                            console.log(`${kickerUserId} kick ${userId}`);
                            MongoDB.updateClanTrphies(kickerUser.clan, function (status, newClanTrophies) {
                                if (status != STATUS_OK) {
                                    callback(STATUS_FAILED);
                                    return;
                                }                              
                                callback(STATUS_OK);
                            });
                        });
                    }).catch((err) => {
                        console.log(err);
                        callback(STATUS_FAILED);
                        return;
                    });
            } else {
                callback(STATUS_NOT_PERMITTED);
            }
        });
    });
}

MongoDB.leaveFromClan = function (userId, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        var clan = user.clan;
        var clanPositionPromise = User.findOneAndUpdate({ _id: userId }, { playerClanPosition: "None" });
        var userclanPromise = User.findOneAndUpdate({ _id: userId }, { clan: null });
        var clanPromise = Clan.findOneAndUpdate({ _id: clan._id }, { $pull: { clanMembers: user._id } });
        Promise.all([clanPositionPromise, clanPromise, userclanPromise])
            .then((result) => {
                var message = `${user.username} leave from clan`;
                MongoDB.addAdminMessage(clan, message, function (status) {
                    if (status != STATUS_OK) {
                        callback(STATUS_FAILED);
                        return;
                    }

                    console.log(`${userId} leave from clan`);
                    MongoDB.updateClanTrphies(clan, function (status, newClanTrophies) {
                        if (status != STATUS_OK) {
                            callback(STATUS_FAILED);
                            return;
                        }
                        callback(STATUS_OK);
                    });
                });
            }).catch((err) => {
                console.log(err);
                callback(STATUS_FAILED);
            });
    });
}

MongoDB.addMessage = function (userId, msg, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        var message = new MessageModel({
            senderID: userId,
            context: msg
        });

        var clan = user.clan;
        if (clan.messages.length < 999) {
            clan.messages.push(message);
            clan.save(function (err, res) {
                if (err) {
                    callback(STATUS_FAILED);
                    return;
                }

                callback(STATUS_OK);
            });
        } else {
            var addMessagePromise = clan.messages.push(message);
            var removeMessagePromise = clan.messages.shift();
            Promise.all([addMessagePromise, removeMessagePromise])
                .then((result) => {
                    callback(STATUS_OK);
                }).catch((err) => {
                    console.log(err);
                    callback(STATUS_FAILED);
                });
        }
    });
}

MongoDB.addReply = function (userId, repliedMsg, msg, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        var message = new MessageModel({
            replyMessage: repliedMsg,
            senderID: userId,
            context: msg
        });

        var clan = user.clan;
        if (clan.messages.length < 999) {
            clan.messages.push(message);
            clan.save(function (err, res) {
                if (err) {
                    console.log("message didn't save!");
                    callback(STATUS_FAILED);
                    return;
                }
                callback(STATUS_OK);
            });
        } else {
            var addMessagePromise = clan.messages.push(message);
            var removeMessagePromise = clan.messages.shift();
            Promise.all([addMessagePromise, removeMessagePromise])
                .then((result) => {
                    callback(STATUS_OK);
                }).catch((err) => {
                    console.log(err);
                    console.log("message didn't save!");
                    callback(STATUS_FAILED);
                });
        }
    });
}

MongoDB.addAdminMessage = function (clanId, msg, callback) {
    MongoDB.getClan(clanId, function (status, clan) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        var message = new MessageModel({
            senderID: null,
            context: msg
        });
    
        if (clan.messages.length < 999) {
            clan.messages.push(message);
            clan.save(function (err, res) {
                if (err) {
                    console.log("message didn't save!");
                    callback(STATUS_FAILED);
                    return;
                }
                callback(STATUS_OK);
            });
        } else {
            var addMessagePromise = clan.messages.push(message);
            var removeMessagePromise = clan.messages.shift();
            Promise.all([removeMessagePromise, addMessagePromise])
                .then((result) => {
                    callback(STATUS_OK);
                }).catch((err) => {
                    console.log(err);
                    console.log("message didn't save!");
                    callback(STATUS_FAILED);
                });
        }
    });
}

MongoDB.changeDescription = function (userId, description, callback) {
    MongoDB.getUser(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        if (user.playerClanPosition == "Leader" || user.playerClanPosition == "Co-Leader") {
            user.clan.description = description;
            user.clan.save(function (err, res) {
                if (err) {
                    console.log("message didn't save!");
                    callback(STATUS_FAILED);
                    return;
                }
                callback(STATUS_OK);
            });
        } else {
            callback(STATUS_NOT_PERMITTED);
        }
    });
}

MongoDB.begin();
