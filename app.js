const dgram = require('dgram');
const User = require('./Models/User.js');
const Match = require('./Models/Match.js');

const Clan = require('./Models/Clan.js');
const HeroProperty = require('./Models/HeroProperty.js');
const ItemProperty = require('./Models/ItemProperty.js');
const Message = require('./Models/Message.js');
const MongoDB = require('./MongoDB.js');
const Player = require('./Controllers/PlayerController');
const _ = require('underscore');
//const nodemailer = require('nodemailer');

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
    var CLIENT_IP = rinfo.address;
    var CLIENT_PORT = rinfo.port;
    var request = JSON.parse(message);
    console.log(request);

    eval(request["_type"])(request["_info"], rinfo);

    // decode message
    
    /*switch (request["_type"]) {

        case "add_clan" :
            var name = info["_name"];
            var leader = info["_leader"];
            console.log("Add Clan Name: " + name + " Leader: " + leader);

            //chack data to be correct
            mongoDB.process("add_clan", info, function (add_clan_state) {
                send_response("add_clan", add_clan_state, CLIENT_IP, CLIENT_PORT);
            })
            break;

        case "search_clan" :
            var search = info["_name"];
            console.log("search for clan contians letter { " + search + " }");

            //search data in db
            mongoDB.process("search_clan", info, function (search_clan_result) {
                send_data("search_clan", search_clan_result, CLIENT_IP, CLIENT_PORT);
            })
            break;
    }*/
});


// send data to client
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