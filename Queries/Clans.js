const Mongoose = require('mongoose');
const User = require('../Models/User.js');
const Clan = require('../Models/Clan.js');
const Message = require('../Models/Schema/Message.js')
const Utils = require('../Utils.js');
const MessageModel = Mongoose.model('Message', Message);

const ClanDB = module.exports = {};

ClanDB.get = function (clanId, callback) {
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

ClanDB.updateTrphies = function (clanId, callback) {
    ClanDB.get(clanId, function (status, clan) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        var trophies = [];
        clan.clanMembers.forEach(function (user) {
            trophies.push(user.trophies);
        });
        trophies.sort(function (a, b) {
            return b - a;
        });

        var newTrophies = 0;
        for (var i = 0; i < clan.clanMembers.length; i++)
            if (i / 10 == 0)
                newTrophies += trophies[i];
            else if (i / 10 == 1)
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

ClanDB.join = function (userId, clanId, callback) {
    MongoDB.Users.get(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (user.clan) {
            console.log(`${userId} already joined in a clan`);
            callback(STATUS_NOT_PERMITTED);
            return;
        }

        ClanDB.get(clanId, function (status, clan) {
            if (status != STATUS_OK) {
                callback(STATUS_FAILED);
                return;
            }

            const userPromise = User.findOneAndUpdate({ _id: userId }, { clan: clanId, playerClanPosition: "Member" });
            const clanPromise = Clan.findOneAndUpdate({ _id: clanId }, { $addToSet: { clanMembers: userId } });

            Promise.all([userPromise, clanPromise])
                .then((result) => {
                    var message = `${user.username} joined to this clan`;
                    ClanDB.addAdminMessage(clan, message, function (status) {
                        if (status != STATUS_OK) {
                            console.log("Message didn't sent!");
                            callback(STATUS_FAILED);
                            return;
                        }
                        console.log(`${userId} joined to this clan`);
                    });

                    ClanDB.updateTrphies(clan, function (status, newTrophies) {
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

ClanDB.new = function (clanName, leaderId, callback) {
    MongoDB.Users.get(leaderId, function (status, leader) {
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
                ClanDB.addAdminMessage(clan, message, function (status) {
                    if (status != STATUS_OK) {
                        callback(STATUS_FAILED);
                        return;
                    }

                    ClanDB.updateTrphies(clan, function (status) {
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

ClanDB.search = function (clanName, callback) {
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

ClanDB.destroy = function (clanId, callback) {
    ClanDB.get(clanId, function (status, clan) {
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

ClanDB.promote = function (promoterUserId, userId, callback) {
    MongoDB.Users.get(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        MongoDB.Users.get(promoterUserId, function (status, promoterUser) {
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
                    ClanDB.addAdminMessage(promoterUser.clan, message, function (status) {
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
                        ClanDB.addAdminMessage(promoterUser.clan, message, function (status) {
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

ClanDB.demote = function (demoterUserId, userId, callback) {
    MongoDB.Users.get(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        MongoDB.Users.get(demoterUserId, function (status, demoterUser) {
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
                    ClanDB.addAdminMessage(demoterUser.clan, message, function (status) {
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

ClanDB.kick = function (kickerUserId, userId, callback) {
    MongoDB.Users.get(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        if (!user.clan) {
            console.log(`${userId} do not joined in a clan`);
            callback(STATUS_NOT_FOUND);
            return;
        }

        MongoDB.Users.get(kickerUserId, function (status, kickerUser) {
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
                        ClanDB.addAdminMessage(kickerUser.clan, message, function (status) {
                            if (status != STATUS_OK) {
                                callback(STATUS_FAILED);
                                return;
                            }

                            console.log(`${kickerUserId} kick ${userId}`);
                            ClanDB.updateTrphies(kickerUser.clan, function (status, newClanTrophies) {
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

ClanDB.leave = function (userId, callback) {
    MongoDB.Users.get(userId, function (status, user) {
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
                ClanDB.addAdminMessage(clan, message, function (status) {
                    if (status != STATUS_OK) {
                        callback(STATUS_FAILED);
                        return;
                    }

                    console.log(`${userId} leave from clan`);
                    ClanDB.updateTrphies(clan, function (status, newClanTrophies) {
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

ClanDB.addMessage = function (userId, msg, callback) {
    MongoDB.Users.get(userId, function (status, user) {
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

ClanDB.addReply = function (userId, repliedMsg, msg, callback) {
    MongoDB.Users.get(userId, function (status, user) {
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

ClanDB.addAdminMessage = function (clanId, msg, callback) {
    ClanDB.get(clanId, function (status, clan) {
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

ClanDB.changeDescription = function (userId, description, callback) {
    MongoDB.Users.get(userId, function (status, user) {
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
