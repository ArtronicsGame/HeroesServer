const dgram = require('dgram');
const User = require('./User.js');
const Match = require('./Match.js');
const MatchHub = require('./MatchHub.js');
const Clan = require('./Clan.js');
const HeroProperty = require('./HeroProperty.js');
const ItemProperty = require('./ItemProperty.js');
const Message = require('./Message.js');
const MongoDB = require('./MongoDB.js');
//const nodemailer = require('nodemailer');

const server = dgram.createSocket('udp4');
const SEVER_PORT = 8008;
const SERVER_IP = '185.55.226.196';

server.bind({port : SEVER_PORT, address : SERVER_IP});

server.on('listening', function(){
  const address = server.address();
  console.log("server listening: " + address.address + ":" + address.port);
  const mongoDB = new MongoDB();
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

    // decode message
    var info = request["_info"];
    switch (request["_type"]) {
        // case "get_ready" :
        //     var newUser = {id : (nextID++).toString(), ip : CLIENT_IP, port : CLIENT_PORT};
        //     users.push(newUser);
        //     send_response("id_callback", { _id : newUser.id}, CLIENT_IP, CLIENT_PORT);
        //     break;

        case "update_pos" :
            users.forEach(user => {
                if(user.id != info["_id"]) 
                    send_response("update_pos", info, user.ip, user.port);
            });
            break;

        case "new_match" :
            var userID = info["_id"];
            var userHero = info["_user_hero"];
            var added = false;
            loby.forEach(matchHub => {
                matchHub.is_user_addable(userHero, function(isAddable) {
                    if (isAddable) {
                        matcheHub.add_user(userID, userHero, CLIENT_IP, CLIENT_PORT);
                        if (matchHub.is_completed()) { //startMatch
                            loby.splice(matchHub);
                            matches.push(matchHub);
                            start_match(matchHub);
                        }
                        added = true;
                    }
                });
            });
            if(added == false) {
                var matchHub = new MatchHub(userID, userHero, CLIENT_IP, CLIENT_PORT);
                loby.push(matchHub)
            }
            break;

        case "new_player" :
            var username = info["_username"];
            var email = info["_email"];
            console.log("New Player ->" + "\tUsername: " + username + "\tEmail: " + email);
            var newUser = new User(nextID++);
            mongoDB.process("register", info, function(register_state) {
                send_response("register_state", {state : register_state}, CLIENT_IP, CLIENT_PORT);
                if (register_state == "register_ok")
                    send_response("id_callback", {_id : newUser.id}, CLIENT_IP, CLIENT_PORT);
            });
            break;

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
    }
});

function start_match(matchHub) {
    matchHub.get_users_data( function (users) {
        users.forEach(user => {
            users.forEach(otherUser => {
                //if(user._id != otherUser._id)
                send_response("update_pos", user, otherUser._ip, otherUser._port);
            });
        });
    });
}

// send data to client
function send_response(type, info, CLIENT_IP, CLIENT_PORT) {
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


/*function send_email(email) {

    nodemailer.createTestAccount((err, account) => {
        
        let transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: account.user, // generated ethereal user
                pass: account.pass // generated ethereal password
            }
        });

        
        let mailOptions = {
            from: 'Admin@ArtronicGameStudio.com', // sender address
            to: email,
            subject: 'Register Email',
            text: "Artronic Game Studio Present \n You Are Successfully Registered!"
        };

        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log("ٍEmail Sent!");
        });
    });
}
*/
