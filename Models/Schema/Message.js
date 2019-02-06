const Mongoose = require('mongoose');

module.exports = new Mongoose.Schema({
    senderID: {type: Mongoose.Schema.Types.ObjectId, ref:'Users'},
    context: {type: String, maxlength: 250},
    replyMessage: {type: String, default: null}
});