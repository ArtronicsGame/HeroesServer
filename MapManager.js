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
    {

    }
    else {
        content = fs.readFileSync(__dirname + `/Colliders/Maps/${name}.hm`, "utf8");
        var lines = content.split("\n");
        Maps.set(name, { shapes: [], dirty: false });

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
                    var input = [x, y, r];
                    items.push(new Circle.default(input));
                    break;
                case "1": // Polygon
                    var rawCoord = shapeData.split(",");
                    var input = [];
                    for (var i = 0; i < rawCoord.length; i += 2) {
                        input.push([rawCoord[i], rawCoord[i + 1]]);
                    }

                    items.push(new Polygon.default(input));
                    break;
            }
        }

        return items;
    }
}

