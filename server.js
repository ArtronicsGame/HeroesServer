const dgram = require('dgram');
const nodemailer = require('nodemailiner');
const server = dgram.createSocket('udp4');
const SEVER_PORT = 8008;
const SERVER_IP = '185.55.226.196';
var nextID = 0;

server.bind({port : SEVER_PORT, address : SERVER_IP});

server.on('listening', function(){
  const address = server.address();
  console.log("server listening: " + address.address + ":" + address.port);
});

var firstTime = true;
var dif = 0;
var users = [];
var length = 0;

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
    
    // response to client
    //send_response(request["_type"], "Data Recived!", CLIENT_IP, CLIENT_PORT);

    // decode message
    var info = request["_info"];
    switch (request["_type"]) {
        case "get_ready" :
            var newUser = {id : (nextID++).toString(), ip : CLIENT_IP, port : CLIENT_PORT};
            users.push(newUser);
            send_response("id_callback", { _id : newUser.id}, CLIENT_IP, CLIENT_PORT);
            break;
        case "update_pos" :
            users.forEach(user => {
                if(user.id != info["_id"]) 
                    send_response("update_pos", info, user.ip, user.port);
            });
            break;
        case "register" :
            var username = info["_username"];
            var password = info["_password"];
            var email = info["_email"];
            console.log("Register Username: " + username + " Password: " + password + " Email: " + email);

            // check data and save to db
            check_data_db("register", info, function (register_state) {
                send_response("register", register_state, CLIENT_IP, CLIENT_PORT);
            });
            break;

        case "login" :
            var username = info["_username"];
            var password = info["_password"];
            console.log("Login Username: " + username + " Password: " + password);

            //check data to be correct
            check_data_db("login", info, function (login_state) {
                send_response("login", login_state, CLIENT_IP, CLIENT_PORT);
            });
            break;

        case "add_clan" :
            var name = info["_name"];
            var leader = info["_leader"];
            console.log("Add Clan Name: " + name + " Leader: " + leader);

            //chack data to be correct
            check_data_db("add_clan", info, function (add_clan_state) {
                send_response("add_clan", add_clan_state, CLIENT_IP, CLIENT_PORT);
            })
            break;

        case "search_clan" :
            var search = info["_name"];
            console.log("search for clan contians letter { " + search + " }");

            //search data in db
            check_data_db("search_clan", info, function (search_clan_result) {
                send_data("search_clan", search_clan_result, CLIENT_IP, CLIENT_PORT);
            })
            break;
    }
});

// send raw data to client
function send_data(msg, CLIENT_IP, CLIENT_PORT) {
    console.log("send message to " + CLIENT_IP + ":" + CLIENT_PORT);
    msg = JSON.stringify(msg);
    console.log("Message: " + msg);
    server.send(msg, CLIENT_PORT, CLIENT_IP, function(err) {
        if (err) {
            console.log(err);
            client.close();
        }
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

// check data in db
function check_data_db(type, info, callback) {
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://Mobin:Mobindige@localhost:27017/gameTestDB";

    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) {
            console.log(err);
            client.close();
        }

	    //connect to game database
        var dbo = db.db("gameTestDB");

        switch (type) {
            case "register" :
                //get info
                var username = info._username;
                var password = info._password;
                var email = info._email;
                dbo.collection("userData").findOne({$or : [{_username : username}, {_email : email}]}, function(err, res) {
                    if (err) {
                        console.log(err);
                        client.close();
                    }

                    // if username is in db it can't add
                    if (res != null) {
                        if(res._username == username) {
                            console.log("username already exists");
                            db.close();
                            callback("username exists");
                        } else {
                            console.log("email already exists");
                            db.close();
                            callback("email exists");
                        }
                    }
                    else { // add user and pass to db as a new user
                        console.log("data is acceptable! :)");
                        var newUser = {_username : username, _password : password, _email : email};
                        dbo.collection("userData").insertOne(newUser, function(err, res) {
                            if (err) {
                                console.log(err);
                                client.close();
                            }
                            console.log("new user added to server: \tusername: " + username + "\tpassword: " + password + "\temail: " + email);
                            db.close();
                            callback("register ok");
                            send_email(email);
                        });
                    }
                });
                break;
        
            case "login" :
                //get info
                var username = info._username;
                var password = info._password;
                dbo.collection("userData").findOne({_username : username}, function(err, res) {
                    if (err) {
                        console.log(err);
                        client.close();
                    }

                    if (res != null) {
                        if (res._password == password) {
                            console.log("login is done by user: " + username + " with pass: " + password);
                            db.close();
                            callback("login ok");
                        }
                        else {
                            callback("password is incorrect");
                        }
                    }
                    else {
                        callback("there is no such user");
                    }
                })
                break;
            
            case "add_clan" :
                var name = info._name;
                var leader = info._leader;
                dbo.collection("clanData").findOne({_name : name}, function(err, res) {
                    if (err) {
                        console.log(err);
                        client.close();
                    }

                    if (res == null) { //new clan can be create!
                        var newClan = {_name : name, _leader : leader};
                        dbo.collection("clanData").insertOne(newClan, function(err, res) {
                            if (err) {
                                console.log(err);
                                client.close();
                            }
                            console.log("new clan added to server: \tname: " + name + "\tleader: " + leader);
                            db.close();
                            callback("clan added");
                        });
                    } else { //clan name exist
                        callback("clan name exists")
                    }
                }); 
                break;

            case "search_clan" :
                var search = info._name;
                dbo.collection("clanData").find({_name : {"$regex": search, "$options": "i"}}).toArray(function(err, result) {
                    if (err) {
                        console.log(err);
                        client.close();
                    }
                    //console.log("search result:");
		             //console.log(result)

                    var selected = new Array(size).fill(false);
                    var data = [];
                    var size = result.length;
                    if (size >= 5) {
                        var i = 0;
                        while (i < 5) {
                            var random = Math.floor(Math.random() * size);
                            if (!selected[random]) {
                                selected[random] = true;
                                data.push(result[random]);
                                i++;
                            }
                        }
                    } else {
                        data = result;
                    }
                    db.close();
		            //console.log("data for send:");
		            //console.log(data)
                    callback(data);
                });
                break;
        }
    });
}

function send_email(email) {

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
