/**
 * Expose the compile function
 */

exports = module.exports = compile;

/**
 * Expose the interpolate function
 */

exports.interpolate = interpolate;

/**
 * Interpolate a string without a compilation step
 *
 * THIS IS NOT RECOMMENDED FOR PRODUCTION USE
 *
 * @param {String} string
 * @param {Object?} params
 * @param {Object?} opts
 */

function interpolate(string, params, opts) {
  return compile(string, opts)(params).join('');
};

/**
 * Compile a string into an interpolate function
 *
 * @param {String} string
 * @param {Object?} opts
 * @return {Function}
 */

function compile(string, opts) {
  opts = opts || {};
  var open = opts.open || '%{';
  var close = opts.close || '}';
  var re = new RegExp('(' + open + ' *[\\-\\d\\w\\.]+ *' + close + ')', 'g');

  var params = 'params';

  var fallback = opts.fallback ?
        ' || ' + JSON.stringify(opts.fallback) :
        '';

  var rawParts = string.split(re);
  var parts = [];
  for (var i = 0, l = rawParts.length, part; i < l; i++) {
    part = rawParts[i];

    // skip the blank parts
    if (!part) continue;

    // it's normal text
    if (part.indexOf(open) !== 0 && part.indexOf(close) !== part.length - close.length) {
      parts.push(JSON.stringify(part));
      continue;
    }

    // it's a interpolation part
    part = part.slice(open.length, -close.length);
    parts.push(params + formatProperty(part) + fallback);
  }

  return new Function(params,
    params + ' = ' + params + ' || {};\nreturn [' + parts.join(', ') + '];');
}

/**
 * Format a property accessor
 *
 * @param {String} prop
 * @return {String}
 */

var re = /^\w+$/;
function formatProperty(prop) {
  if (!re.test(prop)) return '[' + JSON.stringify(prop) + ']';
  var int = parseInt(prop, 10);
  if (Number.isNaN(int)) return '.' + prop;
  return '[' + prop + ']';
}
