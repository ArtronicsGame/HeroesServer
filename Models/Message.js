class Message {
    constructor(senderID, context, replyMessage) {
        this._sender_id = senderID;
        this._context = context;
        this._reply_message = replyMessage;
    }
}

module.exports = Message;