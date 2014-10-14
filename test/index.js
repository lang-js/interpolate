var should = require('should');
var benchmark = require('directiv-test-benchmark');
var interpolate = require('../');
var Polyglot = require('node-polyglot');

describe('interpolate', function() {

  it('should interpolate a string', function() {
    interpolate.interpolate('hello, %{name}', {name: 'Joe'}).should.eql('hello, Joe');
  });

  describe('compile', function() {
    it('should compile a interpolation function', function() {
      var fn = interpolate('hello, %{name}');
      fn.should.be.a.function;
    });

    it('should correctly replace values', function() {
      var fn = interpolate('hello, %{name}');
      fn({name: 'Mike'}).should.eql(['hello, ', 'Mike']);
    });

    it('should correctly replace complex values', function() {
      var fn = interpolate('hello, %{name}');
      fn({name: [{complex: true}]}).should.eql(['hello, ', [{complex:true}]]);
    });

    it('should allow overriding begin and end delimeters', function() {
      var fn = interpolate('hello, {{name}}', {open: '{{', close: '}}'});
      fn({name: 'Brannon'}).should.eql(['hello, ', 'Brannon']);
    });

    it('should return undefined for missing parameters', function() {
      var fn = interpolate('hello, %{name}');
      fn().should.eql(['hello, ', undefined]);
    });

    it('should allow specifying a fallback value', function() {
      var fn = interpolate('hello, %{name}', {fallback: '...'});
      fn().should.eql(['hello, ', '...']);
    });

    it('should replace multiple values', function() {
      var fn = interpolate('hello, %{given-name} %{family-name}');
      var params = {
        'given-name': 'Cameron',
        'family-name': 'Bytheway'
      };
      fn(params).should.eql(['hello, ', 'Cameron', ' ', 'Bytheway']);
    });

    it('should replace multiple instances of the same key', function() {
      var fn = interpolate('I %{repeat} %{repeat}');
      var params = {
        'repeat': 'repeat'
      };
      fn(params).should.eql(['I ', 'repeat', ' ', 'repeat']);
    });

    it('should wrap a string with a yield function', function() {
      var fn = interpolate('if you want more, %{action : check us out!}');
      var params = {
        action: function(value) {
          return ['<a>', value, '</a>'];
        }
      };
      fn(params).should.eql(['if you want more, ', ['<a>', 'check us out!', '</a>']]);
    });
  });

  describe('benchmarks', function() {
    var one = 'hello, %{name}';
    var oneParams = {name: 'Foo'};
    var nine = 'hello, %{1} %{2} %{3} %{4} %{5} %{6} %{7} %{8} %{9}';
    var nineParams = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9};

    describe('lang-js-interpolate compiled', function() {
      describe('one key', function() {
        var fn = interpolate(one);
        benchmark(1000000, 1, fn.bind(null, oneParams));
      });
      describe('nine keys', function() {
        var fn = interpolate(nine);
        benchmark(1000000, 1, fn.bind(null, nineParams));
      });
      describe('yield function', function() {
        var fn = interpolate('you should %{cta : check us out}');
        benchmark(1000000, 1, fn.bind(null, {
          cta: function(cta) {
            return cta + '!';
          }
        }));
      });
    });

    describe('lang-js-interpolate uncompiled', function() {
      describe('one key', function() {
        benchmark(10000, 1, interpolate.interpolate.bind(null, one, oneParams));
      });
      describe('nine keys', function() {
        benchmark(10000, 1, interpolate.interpolate.bind(null, nine, nineParams));
      });
    });

    describe('polyglot.js', function() {
      describe('one key', function() {
        var polyglot = new Polyglot({phrases: {hello: one}});
        benchmark(10000, 1, polyglot.t.bind(polyglot, 'hello', oneParams));
      });
      describe('nine keys', function() {
        var polyglot = new Polyglot({phrases: {hello: nine}});
        benchmark(10000, 1, polyglot.t.bind(polyglot, 'hello', nineParams));
      });
    });
  });
});
