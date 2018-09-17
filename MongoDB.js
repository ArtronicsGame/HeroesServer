class MongoDB {
    constructor() {
    }

    process(type, info, callback) {
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
                                callback("username_exists");
                            } else {
                                console.log("email already exists");
                                db.close();
                                callback("email_exists");
                            }
                        }
                        else { // add user and pass to db as a new user
                            console.log("data is acceptable! :)");
                            var newUser = {_username : username, _email : email};
                            dbo.collection("userData").insertOne(newUser, function(err, res) {
                                if (err) {
                                    console.log(err);
                                    client.close();
                                }
                                console.log("new user added to server: \tusername: " + username + "\temail: " + email);
                                db.close();
                                callback("register_ok");
                                //send_email(email);
                            });
                        }
                    });
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
                        callback(data);
                    });
                    break;
            }
        });
    }
}

module.exports = MongoDB;