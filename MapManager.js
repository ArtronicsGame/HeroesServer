const fs = require('fs');
var _collisions = require('./libs/Collisions/Collisions.js');
var Collisions = _interopRequireDefault(_collisions);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MapManager = module.exports = {};

MapManager.getMap = function (name) {
    var sys = new Collisions.default();
    var content = fs.readFileSync(`./Maps/${name}.hm`, "utf8");
    var lines = content.split("\n");
    console.log(lines);


    for (var k = 0; k < lines.length; k++) {
        if (lines[k].trim() == "")
            return;
        console.log(lines[k]);
        var raw = lines[k].split(";");
        var shapeType = raw[0];
        var shapeData = raw[1];

        var x, y;
        switch (shapeType) {
            case "0": // Circle
                let r;
                var rawCoord = shapeData.split(",");
                x = parseInt(rawCoord[0]), y = parseInt(rawCoord[1]), r = parseInt(rawCoord[2]);
                sys.createCircle(x, y, r);
                break;
            case "1": // Polygon
                var rawCoord = shapeData.split(",");
                x = Number(rawCoord[0]), y = Number(rawCoord[1]);
                let coords = [];
                for (var i = 1; i < rawCoord.length; i += 2) {
                    coords.push([Number(rawCoord[i]), Number(rawCoord[i + 1])]);
                }
                sys.createPolygon(x, y, coords);
                break;
        }
    }

    return sys;
}

