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
  var open = escapeRegex(opts.open || '%{');
  var close = opts.close || '}';
  var char = close.charAt(0);
  var re = new RegExp('(' + escapeRegex(open) + ' *[^' + escapeRegex(char) + ']+ *' + escapeRegex(close) + ')', 'g');

  var params = 'params';

  var fallback = opts.fallback ?
        ' || ' + JSON.stringify(opts.fallback) :
        '';

  var rawParts = string.split(re);
  var parts = [], paramsObj = {};
  for (var i = 0, l = rawParts.length, part, prop; i < l; i++) {
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
    prop = formatProperty(part, params);
    paramsObj[prop[1] || part] = 1;
    parts.push(prop[0] + fallback);
  }

  var fn = new Function('exec, ' + params,
    params + ' = ' + params + ' || {};\nreturn [' + parts.join(', ') + '];');
  fn.params = paramsObj;
  return fn.bind(null, exec);
}

/**
 * Execute a function for a block
 *
 * @param {String} name
 * @param {String} contents
 * @param {Object} params
 * @return {Any}
 */

function exec(name, contents, params) {
  var fn = params[name];
  var type = typeof fn;
  if (type === 'function') return fn(contents, params);
  return type === 'undefined' ? contents : fn;
}

/**
 * Escape any reserved regex characters
 *
 * @param {String} str
 * @return {String}
 */

function escapeRegex(str) {
  return str.replace(/[\^\-\]\\]/g, function(c) {
    return '\\' + c;
  });
}

/**
 * Format a property accessor
 *
 * @param {String} prop
 * @param {String} params
 * @return {String}
 */

var re = /^[\w\d]+$/;
function formatProperty(prop, params) {
  if (!re.test(prop)) {
    var parts = prop.split(/ *: */);
    if (parts.length === 1) return [params + '[' + JSON.stringify(prop) + ']'];

    return ['exec("' + parts[0] + '", "' + parts[1] + '", ' + params + ')', parts[0]];
  }
  var int = parseInt(prop, 10);
  if (isNaN(int)) return [params + '.' + prop];
  return [params + '[' + prop + ']'];
}
