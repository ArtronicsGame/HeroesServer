const MongoDB = module.exports = {};

MongoDB.process = function(type, info, callback) {
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://Mobin:Mobindige@localhost:27017/gameTestDB";

    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) {
            console.log(err);
            client.close();
        }

        //connect to game database
        MongoDB.dbo = db.db("gameTestDB");
        eval("this." + type)(info, callback);
    });
}


MongoDB.newUser = function(newUser, callback) {
    //get info
    var username = newUser._username;
    MongoDB.dbo.collection("userData").findOne({_username : username}, function(err, res) {
        if (err) {
            console.log(err);
            client.close();
        }

        // if username is in db it can't add
        if (res != null) {
            console.log("username already exists");
            db.close();
            callback("username_exists");
        }
        else { // add user and pass to db as a new user
            MongoDB.dbo.collection("userData").insertOne(newUser, function(err, res) {
                if (err) {
                    console.log(err);
                    client.close();
                }
                var id = res.insertedId;
                console.log("new user added to server: \tusername: " + username + "\tid: " + id);
                db.close();
                callback("register_ok", id);
                //send_email(email);
            });
        }
    });
};


MongoDB.addClan = function(newClan, callback) {
    MongoDB.dbo.collection("clanData").findOne({_name : newClan["_name"]}, function(err, res) {
        if (err) {
            console.log(err);
            client.close();
        }

        if (res == null) { //new clan can be create!
            MongoDB.dbo.collection("clanData").insertOne(newClan, function(err, res) {
                if (err) {
                    console.log(err);
                    client.close();
                }
                console.log("new clan added to server: \tname: " + newClan["_name"] + "\tleader: " + newClan["_leader"]["_id"]);
                db.close();
                callback("clan_added", res.insertedId);
            });
        } else { //clan name exist
            callback("clan_name_exists")
        }
    }); 
};


MongoDB.searchClan = function(info, callback) {
    MongoDB.dbo.collection("clanData").find({_name : {"$regex": info._name, "$options": "i"}}).toArray(function(err, result) {
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
};
