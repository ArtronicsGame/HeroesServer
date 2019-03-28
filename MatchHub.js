const execFile = require('child_process').execFile;
const readline = require('readline');

const MATCH_TIME = 3 * 60 * 1000; // Minute * Seconds Per Minute * Milliseconds Per Second
const JOIN_TIMEOUT = 5 * 1000;

class MatchHub {
    constructor(usersIds, matchId) {
        this.hub = {};
        this.hub.usersIds = usersIds;
        this.hub.matchSize = 1;
        this.hub.counter = 0;
        this.hub.matchId = matchId;
        this.hub.match = execFile('/home/centos/Physic/Match');
    }

    tcpHandshake(id, socket) {
        socket.pipe(this.hub.match.stdin, { end: false });
        this.hub.match.stdout.pipe(socket);

        if (++this.hub.counter == 2 * this.hub.matchSize) {
            console.log("Yeeeeap :D");
            this.hub.match.stdin.write("Start\n");
            this.hub.timeOut = setTimeout(this.endMatch, MATCH_TIME, this.hub);
        }
    }

    udpHandshake(id, rinfo) {
        const rl = readline.createInterface({
            input: this.hub.match.stderr
        });

        rl.on('line', (input) => {
            global.sendUDPResponse(input, rinfo);
        });

        console.log(rinfo.address.toString());

        if (++this.hub.counter == 2 * this.hub.matchSize) {
            console.log("Yeeeeap :D");
            this.hub.match.stdin.write("Start\n");
            this.hub.timeOut = setTimeout(this.endMatch, MATCH_TIME, this.hub);
        }
    }

    onPacket(data) {

    }

    endMatch(hub) {
        clearInterval(hub.interval);
        clearTimeout(hub.timeOut);
        //TODO: Judgement & Rewarding
        //TODO: Set Players Match Null
        if (global.Matches.has(hub.matchId))
            global.Matches.delete(hub.matchId);
        global.Utils.freeId(hub.matchId)
    }

    destroy() {
        clearInterval(this.hub.interval);
        clearTimeout(this.hub.timeOut);

        if (global.Matches.has(this.hub.matchId))
            global.Matches.delete(this.hub.matchId);

        global.Utils.freeId(this.hub.matchId)

    }
}

module.exports = MatchHub;