var _collisions = require('./libs/Collisions/Collisions.js');

function getMap(name, callback) {
    var procData = [];
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(`./Maps/${name}.hm`)
    });

    lineReader.on('line', function (line) {
        if (raw.trim() == "")
            return;
        var raw = line.split(";");
        var shapeType = raw[0];
        var shapeData = raw[1];

        switch (shapeType) {
            case "0": // Circle
                let x, y, r;
                let rawCoord = shapeData.split(",");
                x = rawCoord[0], y = rawCoord[1], r = rawCoord[2];
                procData.push(new Circle(x, y, r));
                break;
            case "1": // Polygon
                let x, y;
                let rawCoord = shapeData.split(",");
                x = rawCoord[0], y = rawCoord[1];
                let coords = [];
                for (var i = 1; i < rawCoord.size(); i += 2) {
                    coords.push([rawCoord[i], rawCoord[i + 1]]);
                }
                procData.push(new Polygon(x, y, coords));
                break;
        }
    });

    lineReader.on('close', function () {
        callback(procData);
    });
}