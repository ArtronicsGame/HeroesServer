const Mongoose = require('mongoose');
const User = require('../Models/User.js');
const Clan = require('../Models/Clan.js');
const Message = require('../Models/Schema/Message.js')
const Utils = require('../Utils.js');
const MessageModel = Mongoose.model('Message', Message);

const UserDB = module.exports = {};

UserDB.new = function (username, callback) {
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

UserDB.get = function (userId, callback) {
    User.findOne({ _id: userId }).populate('clan').exec(function (err, res) {
        if (err) {
            console.log(err.message);
            callback(STATUS_FAILED);
            return;
        }
        if (!res) {
            console.log(`User (${userId}) not found`);
            callback(STATUS_NOT_FOUND);
            return;
        }
        callback(STATUS_OK, res);
    })
};

UserDB.getAll = function (callback) {
    User.find().populate('clan').exec(function (err, res) {
        if (err) {
            console.log(err.message);
            callback(STATUS_FAILED)
            return;
        }
        callback(STATUS_OK, res);
    })
};

UserDB.addHeroTrophies = function (userId, hero, amount, callback) {
    UserDB.get(userId, function (status, user) {
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

            UserDB.updateTrphies(user, function (status, newUserTrophies) {
                if (status != STATUS_OK) {
                    callback(STATUS_FAILED);
                    return;
                }
                callback(STATUS_OK, newTrophies);
            });
        });
    });
}

UserDB.addHeroXP = function (userId, hero, amount, callback) {
    UserDB.get(userId, function (status, user) {
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

UserDB.addCoins = function (userId, amount, callback) {
    UserDB.get(userId, function (status, user) {
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

UserDB.levelUpHero = function (userId, hero, callback) {
    UserDB.get(userId, function (status, user) {
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

        var newLevel = ++user.heroesProperties.get(hero).basicInfo.level;
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

UserDB.updateTrphies = function (userId, callback) {
    UserDB.get(userId, function (status, user) {
        if (status != STATUS_OK) {
            callback(STATUS_FAILED);
            return;
        }

        var trophies = [];
        HEROES.forEach(function (hero) {
            trophies.push(user.heroesProperties.get(hero).trophies);
        });
        trophies.sort(function (a, b) {
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
            if (user.clan) {
                MongoDB.Clans.updateTrphies(user.clan, function (status, newClanTrophies) {
                    callback(status);
                });
            } else {
                callback(STATUS_OK, newTrophies);
            }
        });
    });
}

UserDB.unlockHero = function (userId, hero, callback) {
    UserDB.get(userId, function (status, user) {
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

UserDB.changeHero = function (userId, hero, callback) {
    UserDB.get(userId, function (status, user) {
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
