const Mongoose = require('mongoose');
const MessageSchema = require('./Schema/Message.js');

module.exports = Mongoose.model("Clans", new Mongoose.Schema({
    name: { type: String, required: true },
    leader: { type: Mongoose.Schema.Types.ObjectId, ref: 'Users' },
    description: { type: String, maxlength: 100 },
    clanMembers: [{ type: Mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    trophies: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    minTrophies: { type: Number, default: 0 },
    capacity: { type: Number, min: 10, max: 30, default: 30 },
    membersCout: { type: Number, min: 1, max: 30, default: 1 },
    joinType: { type: String, enum: ["Public", "Private", "Close"], default: "Public" },
    pinnedMessage: { type: String, default: null },
    logo: { type: String, enum: ["Simple"], default: "Simple" },
    ClanTeamAttacks: { type: Array, of: Mongoose.Schema.Types.ObjectId, ref: 'Matches' },
    messages: [MessageSchema]
}));