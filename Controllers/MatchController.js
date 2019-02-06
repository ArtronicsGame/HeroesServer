const Match = module.exports = {};
const MatchHub = require('../MatchHub.js');
const Utils = require("../Utils.js");
const DEBUG = require('../DEBUG.js')

var timeOut = 5000;
var loby = [];

var queues = [
    { time: 10000, users: [], trophiesDiff: 200 },
    { time: 20000, users: [], trophiesDiff: 400 },
    { time: 30000, users: [], trophiesDiff: 800 },
    { time: 40000, users: [], trophiesDiff: 1000000 }
];

searchLoby(0);
for (var i = 0; i < queues.length; i++)
    changeQueue(i);
addToLoby(0);


function addToLoby(i) {
    var user;
    if (i == 0)
        user = { _id: 0, trophies: 100, hero: 'tank', time: new Date().getTime(), occupied: false };
    else if (i == 1)
        user = { _id: 1, trophies: 150, hero: 'healer', time: new Date().getTime(), occupied: false };
    else if (i == 2)
        user = { _id: 2, trophies: 200, hero: 'blackhole', time: new Date().getTime(), occupied: false };
    else if (i == 3)
        user = { _id: 3, trophies: 100, hero: 'clockman', time: new Date().getTime(), occupied: false };
    loby.push(user);
    queues[0].users.push(user);
    setTimeout(addToLoby, 5000, i + 1);
}


function searchLoby(index) {
    DEBUG.d({
        Loby: loby,
        Index: index,
        Queue: queues[index],
    }, 'Match', 'LobySearch');

    var users = queues[index].users;
    if (users.length != 0) {
        let diff = queues[index].trophiesDiff;
        var user = users.shift();
        while (!loby.includes(user) && queues[index].users.length != 0)
            user = users.shift();
        if (!loby.includes(user)) {
            setTimeout(changeQueue, timeOut, (index + 1) % 4);
            return;
        }

        user.occupied = true;
        var group = [user];
        var hreoes = [user.hero];
        var anotherTrophies = user.trophies;
        var anotherUser, finished = false, conflict = false;
        while (user.trophies - anotherTrophies <= diff && loby.length != 0 && !finished && !conflict) {
            anotherUser = users.shift();
            if (anotherUser == undefined) {
                setTimeout(changeQueue, timeOut, index);
                return;
            }
            anotherTrophies = anotherUser.trophies;
            if (anotherUser.occupied)
                conflict = true;
            if (!hreoes.includes(anotherUser.hero) && !anotherUser.occupied) {
                group.push(anotherUser);
                hreoes.push(anotherUser.hero);
                anotherUser.occupied = true
            }
            if (group.length == 4)
                finished = true
        }
        if (finished)
            startMatch(group)
        else {
            group.forEach(user => {
                queues[index].users.push(user);
                user.occupied = false;
            });
        }

    }
    if (loby.length > 0)
        setTimeout(searchLoby, timeOut / loby.length, (index + 1) % 4);
    else
        setTimeout(searchLoby, timeOut, (index + 1) % 4);
}

function changeQueue(index) {

    DEBUG.d({
        Index: index,
        Queue: queues[index],
    }, 'Match', 'QueueRefresh');

    var users = queues[index].users;
    if (queues[index].users.length != 0) {
        let diff = queues[index].time;
        var user = users.shift();
        while ((!loby.includes(user) || user == null) && queues[index].users.length != 0)
            user = users.shift();

        if (!loby.includes(user) || user == null) {
            console.log("Hey");

            setTimeout(changeQueue, timeOut, index);
            return;
        }

        //change queue
        let time = new Date().getTime();
        if (time - user.time >= diff) // Forward To Next Queue
            queues[Math.min(index + 1, queues.length - 1)].users.push(user);
        else // Stay There
            queues[index].users.push(user);

    }

    setTimeout(changeQueue, timeOut, index);
}


Match.updatePos = function () {
};

Match.new = function (info, socket) { //info contains id
    let tempData = global.OnlinePlayers[info["_id"]].info;
    var user = { _id: tempData._id, trophies: tempData.trophies, hero: tempData.currentHero, time: new Date().getTime(), occupied: false };
    loby.splice(Utils.findIndex(user, loby, 'trophies'), 0, user);
    queues[0].users.push(user);

    DEBUG.d({
        Loby: loby,
        Queues: queues
    }, 'Match', 'New');
};

function startMatch(matchGroup) {
    var usersId = [];
    matchGroup.forEach(user => {
        usersId.push(user._id);
    });
    console.log("Start Match");
    console.log(usersId);


    //var matchHub = new MatchHub(usersId, 0);
    //matchHub.startMatch();
}