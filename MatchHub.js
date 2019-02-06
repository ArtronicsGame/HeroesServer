const fs = require('fs');
const Match = require('./Models/Match.js');
const { createCanvas } = require('canvas');

var _collisions = require('./libs/Collisions/Collisions.js');
var Collisions = _interopRequireDefault(_collisions);

var _circle = require('./libs/Collisions/modules/Circle.js');
var Circle = _interopRequireDefault(_circle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MATCH_TIME = 2 * 60 * 1000; // Minute * Seconds Per Minute * Milliseconds Per Second
const UPDATE_INTERVAL = 30;

class MatchHub {
    constructor(usersIds, matchId) {
        this.hub = {};

        this.usersIds = usersIds;
        this.usersSocket = [];
        for (var user in usersIds) {
            // this.usersSocket.push(global.OnlinePlayers[user]['socket']);

        }
        this.hub.matchId = matchId;


        //#region Read Map -------------------------------
        this.hub.system = new Collisions.default();
        var content = fs.readFileSync(`./Maps/TestMap.hm`, "utf8");
        var lines = content.split("\n");

        var items = [];
        for (var k = 0; k < lines.length; k++) {
            if (lines[k].trim() == "")
                return;
            var raw = lines[k].split(";");
            var shapeType = raw[0];
            var shapeData = raw[1];

            var x, y;
            switch (shapeType) {
                case "0": // Circle
                    let r;
                    var rawCoord = shapeData.split(",");
                    x = parseInt(rawCoord[0]), y = parseInt(rawCoord[1]), r = parseInt(rawCoord[2]);
                    items.push(new Circle.default(x, y, r));
                    break;
                case "1": // Polygon
                    var rawCoord = shapeData.split(",");
                    x = rawCoord[0], y = rawCoord[1];
                    let coords = [];
                    for (var i = 1; i < rawCoord.length; i += 2) {
                        coords.push([rawCoord[i], rawCoord[i + 1]]);
                    }
                    this.hub.system.createPolygon(x, y, coords);
                    break;
            }
        }

        for (var i = 0; i < items.length; i++)
            this.hub.system.insert(items[i]);
        //#endregion

    }

    startMatch() {
        this.render();
        setTimeout(this.endMatch, MATCH_TIME, this.hub);
        setInterval(this.update, UPDATE_INTERVAL, this.hub);
    }

    //Update Server Driven Object Like Bullets, ...
    update(sys) {

    }

    onMessage() {

    }

    endMatch() {

    }

    render() {
        const canvas = createCanvas(1620, 1000);
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#FFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        this.hub.system.draw(ctx);

        ctx.fillStyle = '#000'
        ctx.stroke();
        ctx.fill();

        console.log('<img src="' + canvas.toDataURL() + '" />');
    }

}

module.exports = MatchHub;