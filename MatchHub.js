const fs = require('fs');
const Match = require('./Models/Match.js');
const ColliderManager = require('./ColliderManager.js');
const { createCanvas } = require('canvas');

var _collisions = require('./libs/Collisions/Collisions.js');
var Collisions = _interopRequireDefault(_collisions);

var _circle = require('./libs/Collisions/modules/Circle.js');
var Circle = _interopRequireDefault(_circle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MATCH_TIME = 0.5 * 60 * 1000; // Minute * Seconds Per Minute * Milliseconds Per Second
const UPDATE_INTERVAL = 100;

class MatchHub {
    constructor(usersIds, matchId) {
        this.hub = {};

        this.hub.usersIds = usersIds;
        this.hub.matchId = matchId;


        //#region Read Map -------------------------------
        this.hub.system = new Collisions.default();

        var items = ColliderManager.getMap("TestMap");
        for (var i = 0; i < items.length; i++)
            this.hub.system.insert(items[i]);

        // this.hub.c = items[0];
        // this.hub.c1 = items[2];
        //#endregion

    }

    startMatch() {
        this.hub.timeOut = setTimeout(this.endMatch, MATCH_TIME, this.hub);
        this.hub.interval = setInterval(this.update, UPDATE_INTERVAL, this.hub);
    }

    //Update Server Driven Object Like Bullets, ...
    update(hub) {
        // hub.c.x++;
        // hub.c1.x += 2;
        // hub.c1.y++;
    }

    onMessage() {

    }

    endMatch(hub) {
        clearInterval(hub.interval);
        clearTimeout(hub.timeOut);
        //TODO:Judgement & Rewarding
        // for (var i = 0; i < hub.usersIds.length; i++) {
        //     global.OnlinePlayers.get(hub.usersIds[i]).match = null;
        // }
        if (global.Matches.has(hub.matchId))
            global.Matches.delete(hub.matchId);
    }

    destroy() {
        clearInterval(this.hub.interval);
        clearTimeout(this.hub.timeOut);
        for (var i = 0; i < this.hub.usersIds.length; i++) {
            global.OnlinePlayers.get(this.hub.usersIds[i]).match = null;
        }

        if (global.Matches.has(hub.matchId))
            global.Matches.delete(hub.matchId);
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

        return canvas.toDataURL('image/jpeg', 0.01);
    }
}

module.exports = MatchHub;