const Match = module.exports = {};
// const MatchHub = require('../MatchHub.js');
const Utils = require("../Utils.js");
const DEBUG = require('../DEBUG.js')

const HEROES = ["IceMan", "BlackHole", "Healer", "Tank", "Wizard", "Cloner", "Invoker", "ClockMan"];
const HEROES_INDEX = { IceMan: 0, BlackHole: 1, Healer: 2, Tank: 3, Wizard: 4, Cloner: 5, Invoker: 6, ClockMan: 7 };
const MAX_DEPTH = 6;
const MATCH_SIZE = 4;

var user = {};

var MainHub = new Array(100);
for (var i = 0; i < 100; i++) {
    MainHub[i] = {
        flag: 0,
        IceMan: [],
        BlackHole: [],
        Healer: [],
        Tank: [],
        Wizard: [],
        Cloner: [],
        Invoker: [],
        ClockMan: [],
        inTime: Infinity
    };
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function isPossible(flag) {
    var index = 0;
    var match = 0;
    while (index < HEROES.length) {
        if ((flag & (1 << index)) > 0) {
            match++;
        }
        index++;
    }
    if (match >= MATCH_SIZE)
        return true;
    return false;
}

function getPossibleMoves(flag) {
    var ans = [];
    var index = 0;
    var match = 0;
    while (index < HEROES.length) {
        if ((flag & (1 << index)) != 0) {
            match++;
            ans.push(index);
        }
        index++;
    }
    ans = shuffle(ans);
    if (match >= MATCH_SIZE)
        return ans;
    return null;
}

function probe() {
    var now = new Date().getTime();

    for (var i = 0; i < 100; i++) {
        while (isPossible(MainHub[i].flag)) {
            makeGroup(i);
        }
    }

    for (var i = 0; i < 100; i++) {
        var neccessary = true;
        while (neccessary && MainHub[i].flag) {
            neccessary = false;
            var d = now - MainHub[i].inTime;
            console.log(d);
            for (var j = 0; j < Math.min((d / 1000) - 1, MAX_DEPTH); j++) {
                if (mergeAndGroup(i, j + 1)) {
                    neccessary = true;
                    break;
                }
            }
        }
    }
}

function mergeAndGroup(index, lvl) {
    var budies = [];

    for (var i = 1; i < lvl; i++) {
        budies.push(index + i);
        if (index - i >= 0)
            budies.push(index - i);
    }


    var flag = MainHub[index].flag;
    for (var i = 0; i < budies.length; i++) {
        flag |= MainHub[budies[i]].flag;
    }

    if (isPossible(flag)) {
        var group = [];
        MainHub[index].inTime = Infinity;
        var Order = getPossibleMoves(flag);
        for (var i = 0; i < MATCH_SIZE; i++) {
            if (MainHub[index][HEROES[Order[i]]].length != 0) {
                group.push(MainHub[index][HEROES[Order[i]]].shift().id);
                if (MainHub[index][HEROES[Order[i]]].length == 0)
                    MainHub[index].flag ^= (1 << Order[i]);
            } else {
                for (var j = 0; j < budies.length; j++) {
                    if (MainHub[budies[j]][HEROES[Order[i]]].length != 0) {
                        var left = MainHub[budies[j]][HEROES[Order[i]]].shift();
                        group.push(left.id);
                        if (MainHub[budies[j]][HEROES[Order[i]]].length == 0)
                            MainHub[budies[j]].flag ^= (1 << Order[i]);
                        if (left.time == MainHub[budies[j]].inTime)
                            setMin(budies[j]);
                        break;
                    }
                }
            }
        }
        setMin(index);
        startMatch(group);
        return true;
    } else
        return false;
}

function setMin(index) {
    var m = Infinity;
    for (var i = 0; i < HEROES.length; i++) {
        if (MainHub[index][HEROES[i]].length != 0)
            m = Math.min(m, MainHub[index][HEROES[i]][0].time);
    }

    MainHub[index].inTime = m;
}

function makeGroup(index) {
    var group = [];
    MainHub[index].inTime = Infinity;
    var Order = getPossibleMoves(MainHub[index].flag);
    for (var i = 0; i < MATCH_SIZE; i++) {
        group.push(MainHub[index][HEROES[Order[i]]].shift().id);
        if (MainHub[index][HEROES[Order[i]]].length == 0)
            MainHub[index].flag ^= (1 << Order[i]);
    }
    setMin(index);
    startMatch(group);
}

function print(maxIndex) {
    for (var i = 0; i < maxIndex; i++) {
        console.log(MainHub[i]);
    }
    console.log(" ");
}

Match.updatePos = function () {

};

Match.new = function (info, socket) { //info contains id
    var data = user[info["_id"]];

    var index = (data.trophies / 100) | 0;
    var t = new Date().getTime();
    MainHub[index][data.currentHero].push({ time: t, id: data["_id"] });
    MainHub[index].inTime = Math.min(MainHub[index].inTime, t);
    MainHub[index].flag |= (1 << HEROES_INDEX[data.currentHero]);
    // console.log(MainHub[index].flag);
    // print(3);
};

function startMatch(matchGroup) {
    console.log(matchGroup);
}

function addToLoby(i) {
    Match.new({ _id: i }, null);
}


user[0] = { _id: 0, trophies: 100, currentHero: 'Tank' };
user[1] = { _id: 1, trophies: 50, currentHero: 'Healer' };
user[2] = { _id: 2, trophies: 140, currentHero: 'BlackHole' };
user[3] = { _id: 3, trophies: 120, currentHero: 'ClockMan' };
user[4] = { _id: 4, trophies: 110, currentHero: 'IceMan' };
user[5] = { _id: 5, trophies: 109, currentHero: 'Wizard' };
user[6] = { _id: 6, trophies: 80, currentHero: 'Cloner' };
user[7] = { _id: 7, trophies: 700, currentHero: 'Invoker' };

// addToLoby(0);
// console.log("--------------------------");
// addToLoby(1);
// console.log("--------------------------");
// addToLoby(2);
// console.log("--------------------------");
// addToLoby(3);
// console.log("--------------------------");
// addToLoby(4);
// console.log("--------------------------");
// addToLoby(5);
// console.log("--------------------------");
// addToLoby(6);
// console.log("--------------------------");
// addToLoby(7);
// console.log("--------------------------");
// setInterval(probe, 500);
// print(3);
