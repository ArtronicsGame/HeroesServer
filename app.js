
const Redis = require('ioredis');
const getPort = require('get-port');
const dgram = require('dgram');
const net = require('net');
const express = require('express');
const path = require('path');
var app = express(),
    bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
global.SERVER_IP = '193.176.243.42';
global.UDPServer = dgram.createSocket('udp4');
global.OnlinePlayers = new Map();
global.SocketIds = new Map();
global.Matches = new Map();

global.RedisDB = new Redis(6379, '193.176.243.42');
global.MongoDB = require('./MongoDB.js');
//#endregion

//#region Connect Modules
const MatchHub = require('./MatchHub.js');
const PlayerController = require('./Controllers/PlayerController.js');
const ClanController = require('./Controllers/ClanController.js');
const MatchController = require('./Controllers/MatchController.js');
const Utils = require('./Utils.js');
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

app.post('/bestPort', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    var users = JSON.parse(req.body.raw);
    console.log(users);
    var matchId = Utils.getId();
    console.log(matchId);
    var ins = new MatchHub(users, matchId);
    global.Matches.set(matchId, ins);

    console.log(DEDICATED_PORT);
    res.status(STATUS_OK).send(JSON.stringify({
        port: DEDICATED_PORT.toString(),
        pmid: PMID,
        matchId: matchId
    }));
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

var htmlPath = path.join(__dirname, 'LiveViewer');

app.use('/viewer', express.static(htmlPath));

io.on('connection', function (socket) {
    DEBUG.d({ Id: socket.id }, 'Match', 'Live', 'Connect');

    socket.on('match', function (matchId) {

        if (Matches.has(matchId)) {
            socket.emit('init', Matches.get(matchId).initCanvas())
            var interval = setInterval(function () {
                if (Matches.get(matchId)) {
                    socket.emit('frame', Matches.get(matchId).render());
                } else {
                    clearInterval(interval);
                    socket.emit('destroyed');
                }
            }, REFRESH_RATE);

            socket.on('disconnect', function () {
                DEBUG.d({ Id: socket.id }, 'Match', 'Live', 'Disconnect');
                clearInterval(interval);
            });
        } else
            socket.emit('matchIdNotFound');
    });

});

http.listen(process.env.PORT || HTTP_PORT);
//#endregion

//#region Socket Server -----------------------------------------------------------
getPort({ port: Array.from(Array(100), (val, key) => key + 1024 + (100 * PMID)) }).then(function (p) {
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
        socket.setNoDelay(true);
        DEBUG.d({
            IP: socket.remoteAddress,
            Port: socket.remotePort
        }, 'Requests', 'TCP', 'Connect');

        socket.on('error', function (err) {
            return;
            DEBUG.d({
                IP: socket.remoteAddress,
                Port: socket.remotePort,
                Message: err
            }, 'Error', 'TCP');


            var id = SocketIds[socket];
            global.OnlinePlayers.delete(id);
            global.SocketIds.delete(socket);
        });

        socket.on('end', function () {
            return;
            DEBUG.d({
                IP: socket.remoteAddress,
                Port: socket.remotePort
            }, 'Requests', 'TCP', 'Disconnect');

            var id = SocketIds[socket];
            global.OnlinePlayers.delete(id);
            global.SocketIds.delete(socket);
        });

        socket.on('data', function (data) {
            PlayerController.get({ _id: '5c61dbf97af24959392825fb' }, socket);
            PlayerController.get({ _id: '5c61dbadf6e2ce5929423572' }, socket);
            return;

            data = Utils.decodeTCP(data);
            var request = data.value;

            DEBUG.d({
                IP: socket.remoteAddress,
                Port: socket.remotePort,
                Type: request["_type"],
                Info: request["_info"]
            }, 'Requests', 'TCP', 'Data');

            eval(request["_type"])(request["_info"], socket);
        });
    });

    dedicatedServer.listen(DEDICATED_PORT, function () {
        DEBUG.d({
            Message: `Dedcated TCPServer #${process.env.pm_id} listening on: ` + SERVER_IP + ":" + DEDICATED_PORT
        }, 'Requests', 'TCP', 'Start');
    });
    //#endregion

    //#region UDP Server
    UDPServer.bind({ port: DEDICATED_PORT, address: SERVER_IP });

    UDPServer.on('listening', function () {
        const address = UDPServer.address();
        DEBUG.d({
            Message: "UDPServer listening on: " + address.address + ":" + address.port
        }, 'Requests', 'UDP', 'Start');
    });

    UDPServer.on('message', function (msg, rinfo) {
        var message = msg.toString("utf-8", 8);
        message = message.substring(0, message.lastIndexOf('}') + 1);

        DEBUG.d({
            IP: rinfo.address,
            Port: rinfo.port,
            Data: message
        }, 'Requests', 'UDP', 'Data');

        var request = JSON.parse(message);
        eval(request["_type"])(request["_info"], rinfo);
    });
    //#endregion
});
//#endregion

//#region UDP Functions -----------------------------------------------------------
// send data to client
global.sendUDPResponse = function (data, rinfo) {
    var CLIENT_IP = rinfo.address;
    var CLIENT_PORT = rinfo.port;

    DEBUG.d({
        IP: CLIENT_IP,
        Port: CLIENT_PORT,
        Data: data
    }, 'Requests', 'UDP', 'Send');

    UDPServer.send(data, CLIENT_PORT, CLIENT_IP, function (err) {
        if (err)
            DEBUG.d({
                IP: CLIENT_IP,
                Port: CLIENT_PORT,
                Data: data
            }, 'Error', 'UDP', 'Send');
    });
}
//#endregion

//#region Test
// var ins = new MatchHub(null, "12");
// global.Matches.set("12", ins);
// ins.startMatch();

//Test :
// ClanDB.new("HojatClan2", "5c61dbadf6e2ce5929423572", function (a, b) { console.log(b) });
// ClanDB.search("o", function (a, b) { });
// ClanDB.get("5c61dd798f56b259a4bc80a5", function (res) { console.log(res); });
// ClanDB.join("5c61dc079947865945e78eb0", "5c61dd798f56b259a4bc80a5", function (a) { console.log(a) });
// ClanDB.promote("5c61dbadf6e2ce5929423572", "5c61dbadf6e2ce5929423572", function (res) { console.log(res) });
// ClanDB.demote("5c61dc079947865945e78eb0", "5c61dbadf6e2ce5929423572", function (res) { console.log(res) });
// ClanDB.kick("5c61dbf97af24959392825fb", "5c61dbadf6e2ce5929423572", function (res) { console.log(res) });
// ClanDB.leave("5c61dbf97af24959392825fb", function (a) { console.log(a); });
// ClanDB.changeDescription("5c61dbadf6e2ce5929423572", "FuckYouMobin", function (a) { console.log(a); });
// ClanDB.addMessage("5c61dbadf6e2ce5929423572", "Hey", function (a) { console.log(a); });
// ClanDB.addReply("5c61dbadf6e2ce5929423572", "Hey", "BokhoreshMobin", function (a) { console.log(a); });

//Test :
// UserDB.new("Ali", function (a, b) { console.log(a + "\n" + b); });
// UserDB.get("5c61dbadf6e2ce5929423572", function(res, user){console.log(res + "\n" + user);});
// UserDB.unlockHero("5c61dbadf6e2ce5929423572", "Tank", function (res) { console.log(res); });
// UserDB.changeHero("5c61dbadf6e2ce5929423572", "Tank", function (a) { console.log(a); });
// UserDB.addHeroTrophies("5c61dbadf6e2ce5929423572", "IceMan", 200, function (a) { console.log(a); });
// UserDB.addHeroXP("5c61dbadf6e2ce5929423572", "IceMan", 1000, function (a) { console.log(a); });
// UserDB.addCoins("5c61dbadf6e2ce5929423572", 1000, function (a) { console.log(a); });
// UserDB.levelUpHero("5c61dbadf6e2ce5929423572", "Tank", function (a) { console.log(a); });

//#endregion
