
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

const MatchHub = require('./MatchHub.js');
const PlayerController = require('./Controllers/PlayerController.js');
const ClanController = require('./Controllers/ClanController.js');
// const MatchController = require('./Controllers/MatchController.js');
const Utils = require('./Utils.js');
const DEBUG = require('./DEBUG.js');

//#region Global Variables -----------------------------------------------------
global.REFRESH_RATE = 500;
global.UDPSERVER_PORT = 8008;
global.TCPSERVER_PORT = 6624;
global.HTTP_PORT = 254;
global.SERVER_IP = '193.176.243.42';
global.UDPServer = dgram.createSocket('udp4');
global.MongoDB = require('./MongoDB.js');
global.OnlinePlayers = {};
global.Matches = new Array(100000);
//#endregion

//#region HTTP Server ----------------------------------------------------------
app.post('/auth', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.body.username == "Mobin") {
        setTimeout(function () {
            res.send(JSON.stringify({
                success: true
            }));
        }, 100);
    } else {
        setTimeout(function () {
            res.send(JSON.stringify({
                success: false
            }));
        }, 100);
    }
});

app.get('/getUsers', function (req, res) {
    MongoDB.getAllUsers((doc) => {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
        });
        res.write(JSON.stringify(doc));
        res.end();
    });
});

var htmlPath = path.join(__dirname, 'LiveViewer');

app.use('/viewer', express.static(htmlPath));

io.on('connection', function (socket) {
    DEBUG.d({ Id: socket.id }, 'Match', 'Live', 'Connect');

    var matchHub = new MatchHub("usersId", 0);
    matchHub.startMatch();

    var interval = setInterval(function () {
        socket.emit('frame', matchHub.render());
    }, REFRESH_RATE);

    socket.on('disconnect', function () {
        DEBUG.d({ Id: socket.id }, 'Match', 'Live', 'Disconnect');
        clearInterval(interval);
        matchHub.destroy();
    });

});


http.listen(process.env.PORT || HTTP_PORT);
//#endregion

//#region TCP Server -----------------------------------------------------------
var server = net.createServer(function (socket) {
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
    });

    socket.on('end', function () {
        DEBUG.d({
            IP: socket.remoteAddress,
            Port: socket.remotePort
        }, 'Requests', 'TCP', 'Disconnect');
    });

    socket.on('data', function (data) {
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

server.listen(TCPSERVER_PORT, function () {
    DEBUG.d({
        Message: "TCPServer listening on: " + SERVER_IP + ":" + TCPSERVER_PORT
    }, 'Requests', 'TCP', 'Start');
});
//#endregion

//#region UDP Server -----------------------------------------------------------
UDPServer.bind({ port: UDPSERVER_PORT, address: SERVER_IP });

UDPServer.on('listening', function () {
    const address = UDPServer.address();
    DEBUG.d({
        Message: "UDPServer listening on: " + address.address + ":" + address.port
    }, 'Requests', 'UDP', 'Start');
    MongoDB.begin();
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


// send data to client
global.sendUDPResponse = function (data, rinfo) {
    var CLIENT_IP = rinfo.address;
    var CLIENT_PORT = rinfo.port;

    DEBUG.d({
        IP: CLIENT_IP,
        Port: CLIENT_PORT,
        Data: data
    }, 'Requests', 'UDP', 'Send');

    UDPServer.send(msg, CLIENT_PORT, CLIENT_IP, function (err) {
        if (err)
            DEBUG.d({
                IP: CLIENT_IP,
                Port: CLIENT_PORT,
                Data: data
            }, 'Error', 'UDP', 'Send');
    });
}
//#endregion
