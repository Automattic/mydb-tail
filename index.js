
/**
 * Module dependencies.
 */

var oplog = require('oplog')
  , redis = require('redis').createClient
  , type = require('type-component')
  , debug = require('debug')('mydb-tail');

/**
 * Module exports.
 */

module.exports = Tailer;

/**
 * Tails the oplog.
 *
 * @api public
 */

function Tailer(opts){
  if (!(this instanceof Tailer)) return new Tailer(opts);
  opts = opts || {};
  this.oplog = oplog(opts.mongo);
  this.redis = opts.redis;

  if (opts.query) this.oplog.query(opts.query);

  if ('object' != typeof this.redis) {
    var uri = parse(this.redis || 'localhost:6379');
    this.redis = redis(uri.port, uri.host);
  }

  this.filter = this.oplog.filter();
  if (opts.ns) this.filter.ns(opts.ns);
  this.filter.on('update', this.op.bind(this));
  this.oplog.tail();
}

/**
 * Runs the tailer.
 *
 * @param {Object} doc
 * @api private
 */

Tailer.prototype.op = function(doc){
  if (!doc.o2._id) return debug('ignoring operation');
  if (doc.o2._id) {
    var id = doc.o2._id.toString();
    delete doc.o2._id;
    var data = JSON.stringify(serialize([doc.o2, doc.o]));
    this.redis.publish(id, data);
    debug('publish %s <- %j', id, data);
  }
};

/**
 * Serializes an object into mongodb json.
 *
 * @param {Object} obj
 * @return {String} json
 * @api private
 */

function serialize(obj){
  switch (type(obj)) {
    case 'object':
      if (obj.toHexString) {
        return { $oid: obj.toString() };
      } else {
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            obj[i] = serialize(obj[i]);
          }
        }
        return obj;
      }
      break;

    case 'array':
      for (var i = 0; i < obj.length; i++) {
        obj[i] = serialize(obj[i]);
      }
      return obj;

    case 'date':
      return { $date: obj };

    default:
      return obj;
  }
};

/**
 * Connection URI parsing utility.
 *
 * @param {String} uri
 * @return {Object} `name: 'localhost', port: 6379`
 * @api private
 */

function parse(uri){
  var pieces = uri.split(':');
  var host = pieces.shift();
  var port = pieces.pop();
  return { host: host, port: port };
}
