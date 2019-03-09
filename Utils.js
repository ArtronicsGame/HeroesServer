const Utils = module.exports = {};
const _ = require('underscore');

var numPool = new Map();
for (var i = 0; i < 2000; i++) {
    numPool.set(i, false);
}

var last = 0;
Utils.getId = function () {
    //TODO: Handle Full Pool Case
    for (; last < 2000; last++) {
        if (numPool.get(last) == false) {
            numPool.set(last, true);
            return last + (PMID * 3000);
        }

        if (last == 1999)
            last = 0;
    }
};

Utils.freeId = function (id) {
    numPool.set(id - (PMID * 3000), false);
};

Utils.encodeTCP = function (rawData) {
    /**
     * Send packet
     * @param client
     * @param value
     */
    var packet = function (data) {
        data = prepareSend(data);
        var buf = new Buffer(data.length + 4);

        //----------------------------------------------------------------------------------------------------------
        // Writes length of the "packet" (variable)
        //----------------------------------------------------------------------------------------------------------
        buf.writeUInt32LE(data.length, 0);

        //----------------------------------------------------------------------------------------------------------
        // Write "variable" into packet
        //----------------------------------------------------------------------------------------------------------
        data.value.copy(buf, 4);

        return buf;
    };

    /**
     * Prepare command message
     * @param value
     * @returns {*}
     */
    var prepareSend = function (value) {
        var data;

        //--------------------------------------------------------------------------------------------------------------
        // Encode process
        //--------------------------------------------------------------------------------------------------------------
        switch (typeof value) {
            case 'undefined':
                break;

            case 'object':
                if (_.isObject(value)) {
                    var encode = [];

                    _.each(value, function (v, i) {
                        encode.push(prepareSend(i));
                        encode.push(prepareSend(v));
                    });

                    data = encodeDictionary(encode);
                }
                break;

            case 'boolean':
                data = encodeBoolean(value);
                break;

            case 'number':
                //------------------------------------------------------------------------------------------------------
                // Integer
                //------------------------------------------------------------------------------------------------------
                if (Number(value) === value && value % 1 === 0) {
                    data = encodeInteger(value);
                }

                //------------------------------------------------------------------------------------------------------
                // Float
                //------------------------------------------------------------------------------------------------------
                if (value === Number(value) && value % 1 !== 0) {
                    data = encodeFloat(value);
                }
                break;

            case 'string':
                data = encodeString(value);
                break;
        }

        return data;
    };

    /**
     * Write type
     * @param buf
     * @param type
     */
    var writeType = function (buf, type) {
        buf.writeUInt32LE(type, 0);
    };

    /**
     * Encode null
     * @returns {{value: Buffer, length: Number}}
     */
    var encodeNull = function () {
        var buf = new Buffer(4);

        writeType(buf, 0);

        return {
            "value": buf,
            "length": buf.length
        };
    };

    /**
     * Encode boolean
     * @param value
     * @returns {{value: Buffer, length: Number}}
     */
    var encodeBoolean = function (value) {
        var buf = new Buffer(8);

        writeType(buf, 1);
        buf.writeUInt32LE(value ? 1 : 0, 4);

        return {
            "value": buf,
            "length": buf.length
        };
    };

    /**
     * Encode integer
     * @param value
     * @returns {{value: Buffer, length: Number}}
     */
    var encodeInteger = function (value) {
        var buf = new Buffer(8);

        writeType(buf, 2);
        buf.writeInt32LE(value, 4);

        return {
            "value": buf,
            "length": buf.length
        };
    };

    /**
     * Encode float
     * @param value
     * @returns {{value: Buffer, length: Number}}
     */
    var encodeFloat = function (value) {
        var buf = new Buffer(8);

        writeType(buf, 3);
        buf.writeFloatLE(value, 4);

        return {
            "value": buf,
            "length": buf.length
        };
    };

    /**
     * Encode string
     * @param value
     * @returns {{value: Buffer, length: Number}}
     */
    var encodeString = function (value) {
        var len = Buffer.byteLength(value);

        //--------------------------------------------------------------------------------------------------------------
        // Calculate the padding
        //--------------------------------------------------------------------------------------------------------------
        var pad = len % 4 == 0 ? 0 : 4 - len % 4;

        //--------------------------------------------------------------------------------------------------------------
        // See below for more details on why 8
        //--------------------------------------------------------------------------------------------------------------
        var buf = new Buffer(8 + len + pad);

        writeType(buf, 4);

        //--------------------------------------------------------------------------------------------------------------
        // Writes the length of the string, in bytes
        //--------------------------------------------------------------------------------------------------------------
        buf.writeUInt32LE(len, 4);

        //--------------------------------------------------------------------------------------------------------------
        // Writes the bytes of the string (utf8)
        //--------------------------------------------------------------------------------------------------------------
        buf.write(value, 8);

        //--------------------------------------------------------------------------------------------------------------
        // Add some bytes to meet the padding of 4 bytes
        //--------------------------------------------------------------------------------------------------------------
        if (pad !== 0) {
            var pos = 8 + len;

            for (var i = 0; i < pad; i++) {
                buf.write('\0', i + pos);
            }
        }

        return {
            "value": buf,
            "length": buf.length
        };
    };

    /**
     * Encode dictionary
     * @param encoded
     * @returns {{value: Buffer, length: Number}}
     */
    var encodeDictionary = function (encoded) {
        var len = 8;

        for (var i in encoded) {
            len += encoded[i].length;
        }

        var buf = new Buffer(len);

        writeType(buf, 18);
        buf.writeUInt32LE((encoded.length / 2) & 0x7FFFFFFF, 4);

        var bufPos = 8;

        //--------------------------------------------------------------------------------------------------------------
        // Add key/value to buffer
        //--------------------------------------------------------------------------------------------------------------
        for (var i in encoded) {
            encoded[i].value.copy(buf, bufPos);
            bufPos += encoded[i].length;
        }

        return {
            "value": buf,
            "length": buf.length
        };
    };

    return packet(rawData);
};

Utils.decodeTCP = function (tcpData) {

    /**
     * Process data
     * @param client
     * @param buf
     */
    var data = function (buf) {
        buf = buf.slice(4);
        var data = decode(buf);
        return data;
    };

    /**
     * Decode data
     * @param buf
     * @returns {*}
     */
    var decode = function (buf) {
        buf = new Buffer(buf);

        var type = buf.readUInt32LE(0),
            data;

        switch (type) {
            case 1:
                data = decodeBoolean(buf);
                break;
            case 2:
                data = decodeInteger(buf);
                break;
            case 3:
                data = decodeFloat(buf);
                break;
            case 4:
                data = decodeString(buf);
                break;
            case 18:
                data = decodeDictionary(buf);
                break;
            case 0:
            default:
                data = {
                    "value": null,
                    "length": 4
                };
                break;
        }

        //--------------------------------------------------------------------------------------------------------------
        // Debug type info
        //--------------------------------------------------------------------------------------------------------------
        //debug('Received [' + type + '] (' + typeof(buf) + '): ' + buf);

        return data;
    };

    /**
     * Decode boolean
     * @param buf
     * @returns {boolean}
     */
    var decodeBoolean = function (buf) {
        //--------------------------------------------------------------------------------------------------------------
        // Read the integer value and check if it's 1 (true)
        //--------------------------------------------------------------------------------------------------------------
        return {
            "value": buf.readUInt32LE(4) === 1,
            "length": 8
        };
    };

    /**
     * Decode integer
     * @param buf
     * @returns {*}
     */
    var decodeInteger = function (buf) {
        //--------------------------------------------------------------------------------------------------------------
        // Read the signed integer
        //--------------------------------------------------------------------------------------------------------------
        return {
            "value": buf.readInt32LE(4),
            "length": 8
        };
    };

    /**
     * Decode float
     * @param buf
     * @returns {*}
     */
    var decodeFloat = function (buf) {
        //--------------------------------------------------------------------------------------------------------------
        // Read the IEE 754 32-Bits Float
        //--------------------------------------------------------------------------------------------------------------
        return {
            // Read the IEE 754 32-Bits Float
            "value": buf.readFloatLE(4),
            "length": 8
        };
    };

    /**
     * Decode string
     * @param buf
     * @returns {string}
     */
    var decodeString = function (buf) {
        //--------------------------------------------------------------------------------------------------------------
        // Read the length of the string, in bytes
        //--------------------------------------------------------------------------------------------------------------
        var len = buf.readUInt32LE(4);
        var pad = len % 4 === 0 ? 0 : 4 - len % 4;

        //--------------------------------------------------------------------------------------------------------------
        // Read the bytes of the string (utf8)
        //--------------------------------------------------------------------------------------------------------------
        return {
            "value": buf.toString('utf8', 8, 8 + len),
            "length": 8 + len + pad
        };
    };

    /**
     * Decode dictionary
     * @param buf
     * @returns {{value: {}, length: number}}
     */
    var decodeDictionary = function (buf) {
        //--------------------------------------------------------------------------------------------------------------
        // Read the number of entries
        //--------------------------------------------------------------------------------------------------------------
        var nrEntries = buf.readUInt32LE(4) & 0x7FFFFFFF;

        var dict = {},
            bufPos = 8;

        for (var i = 0; i < nrEntries; i++) {
            var decodedKey = decode(buf.slice(bufPos));
            bufPos += decodedKey.length;

            var decodedValue = decode(buf.slice(bufPos));
            bufPos += decodedValue.length;

            dict[decodedKey.value] = decodedValue.value;
        }

        return {
            "value": dict,
            "length": bufPos
        };
    };

    return data(tcpData);
}

Utils.findIndex = function (data, array, attribute) {
    if (array.length == 0)
        return 0;
    var scale = data[attribute];
    var start = 0, end = array.length, mid;
    while (start < end) {
        mid = Math.floor((start + end) / 2);

        if (scale > array[mid][attribute])
            start = mid + 1;
        else if (scale < array[mid][attribute])
            end = mid;
        else
            break;
    }
    if (scale > array[mid][attribute])
        mid++;
    return mid;
}

Utils.SwapArrayCells = function (array) {
    for (var i = 0; i < array.length; i++) {
        var a = Math.floor(Math.random() * array.length);
        var b = Math.floor(Math.random() * array.length);
        var swap;
        swap = array[a];
        array[b] = array[a];
        array[a] = swap;
    }

    return array;
}