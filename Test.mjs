const MatchHub = require('./MatchHub.js');


export default class Stress {
    constructor() {
        this.element = document.createElement('div');
        this.canvas = document.createElement('canvas');

        var matchHub = new MatchHub("usersId", 0);
        matchHub.startMatch();

        this.context = matchHub.onMessage();
    }

}
