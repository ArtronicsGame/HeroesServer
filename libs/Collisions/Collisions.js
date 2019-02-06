'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Point = exports.Polygon = exports.Circle = exports.Result = exports.Collisions = exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _BVH = require('./modules/BVH.js');

var _BVH2 = _interopRequireDefault(_BVH);

var _Circle = require('./modules/Circle.js');

var _Circle2 = _interopRequireDefault(_Circle);

var _Polygon = require('./modules/Polygon.js');

var _Polygon2 = _interopRequireDefault(_Polygon);

var _Point = require('./modules/Point.js');

var _Point2 = _interopRequireDefault(_Point);

var _Result = require('./modules/Result.js');

var _Result2 = _interopRequireDefault(_Result);

var _SAT = require('./modules/SAT.js');

var _SAT2 = _interopRequireDefault(_SAT);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A collision system used to track bodies in order to improve collision detection performance
 * @class
 */
var Collisions = function () {
	/**
  * @constructor
  */
    function Collisions() {
        _classCallCheck(this, Collisions);

        /** @private */
        this._bvh = new _BVH2.default();
    }

	/**
  * Creates a {@link Circle} and inserts it into the collision system
  * @param {Number} [x = 0] The starting X coordinate
  * @param {Number} [y = 0] The starting Y coordinate
  * @param {Number} [radius = 0] The radius
  * @param {Number} [scale = 1] The scale
  * @param {Number} [padding = 0] The amount to pad the bounding volume when testing for potential collisions
  * @returns {Circle}
  */


    _createClass(Collisions, [{
        key: 'createCircle',
        value: function createCircle() {
            var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var radius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
            var scale = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            var padding = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

            var body = new _Circle2.default(x, y, radius, scale, padding);

            this._bvh.insert(body);

            return body;
        }

		/**
   * Creates a {@link Polygon} and inserts it into the collision system
   * @param {Number} [x = 0] The starting X coordinate
   * @param {Number} [y = 0] The starting Y coordinate
   * @param {Array<Number[]>} [points = []] An array of coordinate pairs making up the polygon - [[x1, y1], [x2, y2], ...]
   * @param {Number} [angle = 0] The starting rotation in radians
   * @param {Number} [scale_x = 1] The starting scale along the X axis
   * @param {Number} [scale_y = 1] The starting scale long the Y axis
   * @param {Number} [padding = 0] The amount to pad the bounding volume when testing for potential collisions
   * @returns {Polygon}
   */

    }, {
        key: 'createPolygon',
        value: function createPolygon() {
            var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var points = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [[0, 0]];
            var angle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
            var scale_x = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
            var scale_y = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
            var padding = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;

            var body = new _Polygon2.default(x, y, points, angle, scale_x, scale_y, padding);

            this._bvh.insert(body);

            return body;
        }

		/**
   * Creates a {@link Point} and inserts it into the collision system
   * @param {Number} [x = 0] The starting X coordinate
   * @param {Number} [y = 0] The starting Y coordinate
   * @param {Number} [padding = 0] The amount to pad the bounding volume when testing for potential collisions
   * @returns {Point}
   */

    }, {
        key: 'createPoint',
        value: function createPoint() {
            var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var padding = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            var body = new _Point2.default(x, y, padding);

            this._bvh.insert(body);

            return body;
        }

		/**
   * Creates a {@link Result} used to collect the detailed results of a collision test
   */

    }, {
        key: 'createResult',
        value: function createResult() {
            return new _Result2.default();
        }

		/**
   * Creates a Result used to collect the detailed results of a collision test
   */

    }, {
        key: 'insert',


		/**
   * Inserts bodies into the collision system
   * @param {...Circle|...Polygon|...Point} bodies
   */
        value: function insert() {
            for (var _len = arguments.length, bodies = Array(_len), _key = 0; _key < _len; _key++) {
                bodies[_key] = arguments[_key];
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var body = _step.value;

                    this._bvh.insert(body, false);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return this;
        }

		/**
   * Removes bodies from the collision system
   * @param {...Circle|...Polygon|...Point} bodies
   */

    }, {
        key: 'remove',
        value: function remove() {
            for (var _len2 = arguments.length, bodies = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                bodies[_key2] = arguments[_key2];
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = bodies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var body = _step2.value;

                    this._bvh.remove(body, false);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return this;
        }

		/**
   * Updates the collision system. This should be called before any collisions are tested.
   */

    }, {
        key: 'update',
        value: function update() {
            this._bvh.update();

            return this;
        }

		/**
   * Draws the bodies within the system to a CanvasRenderingContext2D's current path
   * @param {CanvasRenderingContext2D} context The context to draw to
   */

    }, {
        key: 'draw',
        value: function draw(context) {
            return this._bvh.draw(context);
        }

		/**
   * Draws the system's BVH to a CanvasRenderingContext2D's current path. This is useful for testing out different padding values for bodies.
   * @param {CanvasRenderingContext2D} context The context to draw to
   */

    }, {
        key: 'drawBVH',
        value: function drawBVH(context) {
            return this._bvh.drawBVH(context);
        }

		/**
   * Returns a list of potential collisions for a body
   * @param {Circle|Polygon|Point} body The body to test for potential collisions against
   * @returns {Array<Body>}
   */

    }, {
        key: 'potentials',
        value: function potentials(body) {
            return this._bvh.potentials(body);
        }

		/**
   * Determines if two bodies are colliding
   * @param {Circle|Polygon|Point} target The target body to test against
   * @param {Result} [result = null] A Result object on which to store information about the collision
   * @param {Boolean} [aabb = true] Set to false to skip the AABB test (useful if you use your own potential collision heuristic)
   * @returns {Boolean}
   */

    }, {
        key: 'collides',
        value: function collides(source, target) {
            var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var aabb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

            return (0, _SAT2.default)(source, target, result, aabb);
        }
    }], [{
        key: 'createResult',
        value: function createResult() {
            return new _Result2.default();
        }
    }]);

    return Collisions;
}();

;

exports.default = Collisions;
exports.Collisions = Collisions;
exports.Result = _Result2.default;
exports.Circle = _Circle2.default;
exports.Polygon = _Polygon2.default;
exports.Point = _Point2.default;