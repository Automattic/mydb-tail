
/**
 * Test dependencies
 */

var redis = require('redis').createClient()
  , woot = require('monk')('localhost:27017/test').get('woot-' + Date.now())
  , tailer = require('..')
  , expect = require('expect.js');

/**
 * Tests.
 */

describe('mydb-tail', function(){

  it('should publish an op', function(done){
    woot.insert({ a: 'b' }, function(err, doc){
      if (err) return done(err);

      var id = doc._id.toString();
      var log = tailer();

      redis.subscribe(id, function(err){
        if (err) return done(err);
        woot.update({ a: 'b' }, {
          $set: {
            a: new Date,
            b: 'c',
            c: 'd'
          }
        });
      });

      redis.on('message', function(channel, msg){
        expect(channel).to.be(id);
        var obj = JSON.parse(msg);
        expect(obj[0]).to.eql({});
        expect(obj[1].$set.a.$date).to.be.a('string');
        expect(obj[1].$set.b).to.be('c');
        expect(obj[1].$set.c).to.be('d');
        done();
      });
    });
  });

});
