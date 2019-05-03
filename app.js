const Redis = require('ioredis');
const getPort = require('get-port');
const net = require('net');
const express = require('express');
const path = require('path');
const BSONStream = require('bson-stream');
var app = express(),
    bodyParser = require('body-parser');
var http = require('http').Server(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//#region Global Variables -----------------------------------------------------
global.STATUS_OK = 200;
global.STATUS_TIMEOUT = 504;
global.STATUS_UNAUTHORIZED = 401;
global.STATUS_NOT_FOUND = 404;
global.STATUS_DUPLICATE = 409;
global.STATUS_FAILED = 500;
global.STATUS_NOT_PERMITTED = 400;
global.HEROES = ["IceMan", "BlackHole", "Healer", "Tank", "Wizard", "Cloner", "Invoker", "ClockMan"];
global.PMID = process.env.pm_id;
global.DEDICATED_PORT = 0;

global.REFRESH_RATE = 500;
global.TCPSERVER_PORT = 8008;
global.HTTP_PORT = 254;
global.SERVER_IP = '5.253.27.99';
global.OnlinePlayers = new Map();
global.SocketIds = new Map();
global.Matches = new Map();

global.RedisDB = new Redis(6379, '5.253.27.99');
global.MongoDB = require('./MongoDB.js');
global.Utils = require('./Utils.js');
//#endregion

//#region Connect Modules
const MatchHub = require('./MatchHub.js');
const PlayerController = require('./Controllers/PlayerController.js');
const ClanController = require('./Controllers/ClanController.js');
const MatchController = require('./Controllers/MatchController.js');
const DEBUG = require('./DEBUG.js');
//#endregion

//#region HTTP Server ----------------------------------------------------------
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/auth', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    MongoDB.ControlPanel.loginUser(req.body.username, req.body.password, function (status, token) {
        if (status == STATUS_OK)
            setTimeout(function () {
                res.status(STATUS_OK).send(JSON.stringify({
                    token: token
                }));
            }, 100);
        else
            setTimeout(function () {
                res.status(status).send();
            }, 100);
    });
});

app.get('/getUsers', function (req, res) {
    MongoDB.Users.getAll((status, doc) => {
        console.log(doc);
        if (status == STATUS_OK)
            res.status(status).write(JSON.stringify(doc));
        else
            res.status(status).write();
        res.end();
    });
});

app.post('/onSpawn', function (req, res) {
    MongoDB.Match.new(req.body.userIds, req.body.serverIP, req.body.serverPort, function (status, mid) {
        if (status == STATUS_OK) {
            res.status(status).send(JSON.stringify({
                id: mid
            }));
        } else if (status == STATUS_FAILED) {
            console.log("Match Creation Failed");
        }
    });
});

var htmlPath = path.join(__dirname, 'LiveViewer');

app.use('/viewer', express.static(htmlPath));

http.listen(process.env.PORT || HTTP_PORT);
//#endregion

//#region MatchPoint
var matchPoint = net.createServer(function (socket) {
    socket.setNoDelay(true);

    socket.on('error', function (err) {
        //TODO: Handle The Error
    });

    socket.on('close', function () {

    });


    socket.pipe(new BSONStream()).on('data', function (request) {
        console.log("Message Income");
        if (request["_type"] == "Result") {
            MatchController.result(request["_info"], socket);
        }
    });

    // var total = "";
    // socket.on('data', function (data) {
    //     try {
    //         total += data.toString();
    //         var request = JSON.parse(total);
    //         total = "";
    //         console.log("Message Complete");
    //         if (request["_type"] == "Result") {
    //             MatchController.result(request["_info"], socket);
    //         }
    //     } catch (err) {
    //         console.log("Not Enough");
    //     }
    // });
});

matchPoint.listen(1111, function () {
    DEBUG.d({
        Message: "Match TCPServer listening on: " + SERVER_IP + ":" + 1111
    }, 'Requests', 'TCP', 'Start');
});
//#endregion

//#region Socket Server -----------------------------------------------------------
getPort({
    port: Array.from(Array(100), (val, key) => key + 1024 + (100 * PMID))
}).then(function (p) {
    global.DEDICATED_PORT = p;
    //#region Shared TCP Server
    var sharedServer = net.createServer(function (socket) {
        socket.setNoDelay(true);

        socket.on('error', function (err) {
            //TODO: Handle The Error
        });

        socket.write(`${DEDICATED_PORT}\r\n`);

        DEBUG.d({
            Message: `A Client Forward To ${DEDICATED_PORT}`
        }, 'Requests', 'SharedTCP', 'Forward');

        setTimeout(() => socket.destroy(), 1000);
    });

    sharedServer.listen(TCPSERVER_PORT, function () {
        DEBUG.d({
            Message: "Shared TCPServer listening on: " + SERVER_IP + ":" + TCPSERVER_PORT
        }, 'Requests', 'TCP', 'Start');
    });
    //#endregion

    //#region Dedicated TCP Server 
    var dedicatedServer = net.createServer(function (socket) {
        RedisDB.incr("OnlineUsers");
        socket.setNoDelay(true);

        DEBUG.d({
            IP: socket.remoteAddress,
            Port: socket.remotePort
        }, 'Requests', 'TCP', 'Connect');

        socket.on('error', function (err) {
            DEBUG.d({
                IP: socket.remoteAddress,
                Port: socket.remotePort,
                Message: err
            }, 'Error', 'TCP');

            socket.destroy();
        });

        socket.on('close', function () {
            DEBUG.d({
                IP: socket.remoteAddress,
                Port: socket.remotePort
            }, 'Requests', 'TCP', 'Disconnect');

            RedisDB.decr("OnlineUsers");
            var id = SocketIds[socket];
            global.OnlinePlayers.delete(id);
            global.SocketIds.delete(socket);
        });

        socket.on('data', function (data) {
            try {
                data = JSON.parse(data);
                var request = data;

                DEBUG.d({
                    IP: socket.remoteAddress,
                    Port: socket.remotePort,
                    Type: request["_type"],
                    Info: request["_info"]
                }, 'Requests', 'TCP', 'Data');

                try {
                    eval(request["_type"])(request["_info"], socket);
                } catch (err) {
                    console.log("Invalid Operation");
                }
            } catch (e) {}
        });
    });

    dedicatedServer.listen(DEDICATED_PORT, function () {
        DEBUG.d({
            Message: `Dedicated TCPServer #${process.env.pm_id} listening on: ` + SERVER_IP + ":" + DEDICATED_PORT
        }, 'Requests', 'TCP', 'Start');
    });
    //#endregion
});
//#endregion