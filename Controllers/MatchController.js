const Match = module.exports = {};

Match.result = function (info, socket) {
    console.log("Here")
    var cnt = info["Winners"].length;
    var matchId = info["MatchID"];
    var action = info["Actions"];
    for (var i = 0; i < info["Winners"].length; i++) {
        MongoDB.Users.addCoins(info["Winners"][i], 501, function (status, newCoin) {
            if (--this.cnt == 0) {
                socket.write("OK\r\n")
            }
        }.bind({
            counter: cnt
        }));
    }

    MongoDB.Match.result(matchId, action);
}