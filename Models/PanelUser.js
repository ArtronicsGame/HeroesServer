const Mongoose = require('mongoose');
var UniId = require('uniqid');

module.exports = Mongoose.model("PanelUsers", Mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String, default: UniId() },
    tokenDate: { type: Date, default: Date.now() },
    permissionLevel: { type: Number, default: 1 }
}));