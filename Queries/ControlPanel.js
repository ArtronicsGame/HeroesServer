const PanelUsers = require("../Models/PanelUser.js");
var UniId = require('uniqid');

const ControlPanel = module.exports = {};

const VALID_TIME = 5 * 60 * 1000;

ControlPanel.isValid = function (token, callback) {
    PanelUsers.findOne({ token: token }, function (err, res) {
        if (err) {
            callback(STATUS_FAILED);
            console.log(err);
            return;
        }

        if (!res) {
            callback(STATUS_UNAUTHORIZED);
            return;
        }

        if (Date.now() - res.tokenDate <= VALID_TIME) {
            res.tokenDate = Date.now();
            res.save(function (err, res) {
                if (!err)
                    callback(STATUS_OK, res.permissionLevel);
                else
                    callback(STATUS_FAILED);
            });
        } else {
            callback(STATUS_UNAUTHORIZED);
        }
    });
}

ControlPanel.createUser = function (username, password, permissionLevel, callback) {
    PanelUsers.create({ username: username, password: password, permissionLevel: permissionLevel }, function (err, res) {
        if (err) {
            if (err.message.includes("duplicate"))
                callback(STATUS_DUPLICATE);
            else
                callback(STATUS_FAILED);
            return;
        }

        if (!res) {
            callback(STATUS_FAILED);
            return;
        }

        callback(STATUS_OK, res.token);
    });
}

ControlPanel.loginUser = function (username, password, callback) {
    PanelUsers.findOneAndUpdate({ username: username, password: password }, { token: UniId(), tokenDate: Date.now() }, function (err, res) {
        if (err) {
            callback(STATUS_FAILED);
            return;
        }

        if (!res) {
            callback(STATUS_UNAUTHORIZED);
            return;
        }

        res.token = UniId();
        res.tokenDate = Date.now();

        res.save(function (err, res) {
            if (!err)
                callback(STATUS_OK, res.token);
            else
                callback(STATUS_FAILED);
        });
    });
}