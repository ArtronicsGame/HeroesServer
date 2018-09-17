const dgram = require('dgram');
const MongoDB = require('./MongoDB.js');
const Player = require('./Controllers/PlayerController');
const Clan = require('./Controllers/ClanController');
const Match = require('./Controllers/MatchController');
const _ = require('underscore');

global.server = dgram.createSocket('udp4');
global.SERVER_PORT = 8008;
global.SERVER_IP = '185.55.226.137';

server.bind({port : SERVER_PORT, address : SERVER_IP});

server.on('listening', function(){
  const address = server.address();
  console.log("server listening: " + address.address + ":" + address.port);
});


var nextID = 0;
var matches = [];
var loby = [];

server.on('message', function(msg, rinfo) {

    // get message
    console.log(msg);
    var message = msg.toString("utf-8", 8);
    message = message.substring(0, message.lastIndexOf('}') + 1);
    console.log("message recived from " + rinfo.address + ":" + rinfo.port);
    var request = JSON.parse(message);
    console.log(request);

    eval(request["_type"])(request["_info"], rinfo);
});


// send response to client
global.send_response = function (type, info, rinfo) {
    var CLIENT_IP = rinfo.address;
    var CLIENT_PORT = rinfo.port;
    console.log("send message to " + CLIENT_IP + ":" + CLIENT_PORT);
    console.log(type + " response: " + info);
    var msg = {_type : type, _info : info};
    msg = JSON.stringify(msg);
    server.send(msg, CLIENT_PORT, CLIENT_IP, function(err) {
        if (err) {
            console.log(err);
            client.close();
        }
    });
}