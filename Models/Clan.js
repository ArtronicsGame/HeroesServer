const Mongoose = require('mongoose');
const MessageSchema = require('./Schema/Message.js');

module.exports = Mongoose.model("Clans", new Mongoose.Schema({
    name: { type: String, required: true },
    leader: { type: Mongoose.Schema.Types.ObjectId, ref: 'Users' },
    description: { type: String, maxlength: 100 },
    clanMembers: [{ type: Mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    trophies: { type: Number },
    messages: [MessageSchema]
}));