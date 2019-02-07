const fs = require('fs');

var _circle = require('./libs/Collisions/modules/Circle.js');
var Circle = _interopRequireDefault(_circle);

var _polygon = require('./libs/Collisions/modules/Polygon.js');
var Polygon = _interopRequireDefault(_polygon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MapManager = module.exports = {};

var Maps = new Map();

MapManager.getMap = function (name) {
    var content;
    if (Maps.has(name) && !Maps[name].dirty)//Dirty Param Becomes True When Map Updated From Control Panel And Server Was Up
        content = Maps[name].str;
    else {
        content = fs.readFileSync(__dirname + `/Maps/${name}.hm`, "utf8");
        Maps[name] = { str: content, dirty: false };
    }

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
                items.push(new Polygon.default(x, y, coords));
                break;
        }
    }

    return items;
}

