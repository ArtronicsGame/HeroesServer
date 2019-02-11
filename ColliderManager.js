const fs = require('fs');

var _circle = require('./libs/Collisions/modules/Circle.js');
var Circle = _interopRequireDefault(_circle);

var _polygon = require('./libs/Collisions/modules/Polygon.js');
var Polygon = _interopRequireDefault(_polygon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const ColliderManager = module.exports = {};

var Maps = new Map();
var Objects = new Map();
var Heroes = new Map();
var MapsWithObject = new Map();

ColliderManager.getMap = function (name) {
    if (Maps.has(name) && !Maps.get(name).dirty)//Dirty Param Becomes True When Map Updated From Control Panel And Server Was Up
    {
        var content = Maps.get(name).shapes;
        var items = [];

        for (var i = 0; i < content.length; i++) {
            var data = content[i];
            switch (data[0]) {
                case 0:
                    items.push(new Circle.default(data[1], data[2], data[3]));
                    break;
                case 1:
                    items.push(new Polygon.default(data[1], data[2], data[3]));
                    break;
            }
        }

        return items;
    }
    else {
        var content = fs.readFileSync(__dirname + `/Colliders/Maps/${name}.hm`, "utf8");
        var lines = content.split("\r\n");
        var temp = [];

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
                    var input = [0, x, y, r];
                    temp.push(input);
                    items.push(new Circle.default(x, y, r));
                    break;
                case "1": // Polygon
                    var rawCoord = shapeData.split(",");
                    x = parseInt(rawCoord[0]), y = parseInt(rawCoord[1]);
                    var input = [];
                    var coord = [];

                    for (var i = 2; i < rawCoord.length; i += 2) {
                        coord.push([parseInt(rawCoord[i]), parseInt(rawCoord[i + 1])]);
                    }
                    temp.push([1, x, y, coord]);
                    items.push(new Polygon.default(x, y, coord));
                    break;
                case "2": // Objects 
                    var rawCoord = shapeData.split(",");
                    x = parseInt(rawCoord[0]), y = parseInt(rawCoord[1]);
                    var coord = this.getObject(rawCoord[2]);
                    temp.push([1, x, y, coord]);
                    items.push(new Polygon.default(x, y, coord));
                    break;
            }
        }
        Maps.set(name, { shapes: temp, dirty: false });

        return items;
    }
}

ColliderManager.getObject = function (name) {
    if (Objects.has(name) && !Objects.get(name).dirty) {
        return Objects.get(name).shape;
    } else {
        var content = fs.readFileSync(__dirname + `/Colliders/Objects/${name}.pop`, "utf8");
        var rawCoord = content.split(",");
        var coord = [];

        for (var i = 0; i < rawCoord.length; i += 2) {
            coord.push([parseInt(rawCoord[i]), parseInt(rawCoord[i + 1])]);
        }
        Objects.set(name, { shape: coord, dirty: false });
        return coord;
    }
}

ColliderManager.getHero = function (name) {

}

ColliderManager.newMap = function (name, data) {

}

ColliderManager.newObject = function (name, data) {

}

ColliderManager.newHero = function (name, data) {

}
