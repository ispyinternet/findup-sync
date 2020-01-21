'use strict';

/**
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var isGlob = require('is-glob');
var resolveDir = require('resolve-dir');
var detect = require('detect-file');
var mm = require('micromatch');

/**
 * @param  {String|Array} `pattern` Glob pattern or file path(s) to match against.
 * @param  {Object} `options` Options to pass to [micromatch]. Note that if you want to start in a different directory than the current working directory, specify the `options.cwd` property here.
 * @return {String} Returns the first matching file.
 * @api public
 */

module.exports = function(patterns, options) {

  options = options || {};

  var cwd = path.resolve(resolveDir(options.cwd || ''));
  var res;
  if (typeof patterns === 'string') {
    res = lookup(cwd, [patterns], [], options);
    return result(res);
  }

  if (!Array.isArray(patterns)) {
    throw new TypeError('findup-sync expects a string or array as the first argument.');
  }

  res = lookup(cwd, patterns, [], options);
  return result(res);

};

function result(res) {
  // backward compatibility
  if (res.length === 1) {
    return res[0];
  }
  // new functionality can return array
  if (res.length > 1) {
    return res;
  }
  // backward compatibility - return null not empty array!
  return null;
}

function lookup(cwd, patterns, matches, options) {
  var len = patterns.length;
  var idx = -1;
  var shouldContinue = true;

  while (++idx < len && shouldContinue) {
    if (isGlob(patterns[idx])) {
      matchFile(cwd, patterns[idx], matches, options);
    }
    else {
      var file = findFile(cwd, patterns[idx], options);
      if (file) {
        matches.push(file);
      }
    }
    if (matches.length && options.all !== true) {
      return matches;
    }
  }

  var dir = path.dirname(cwd);
  if (dir === cwd) {
    return matches;
  }
  return lookup(dir, patterns, matches, options);
}

function matchFile(cwd, pattern, matches, opts) {
  var isMatch = mm.matcher(pattern, opts);
  var files = tryReaddirSync(cwd);
  var len = files.length;
  var idx = -1;

  var shouldContinue = true;
  while (++idx < len && shouldContinue) {
    var name = files[idx];
    var fp = path.join(cwd, name);
    if (isMatch(name) || isMatch(fp)) {
      matches.push(fp);
      if (!opts.all) { shouldContinue = false; }
    }
  }
}
/**
 * @returns filename | null
 */
function findFile(cwd, filename, options) {
  var fp = cwd ? path.resolve(cwd, filename) : filename;
  return detect(fp, options);
}

function tryReaddirSync(fp) {
  try {
    return fs.readdirSync(fp);
  }
  catch (err) {
    // Ignore error
  }
  return [];
}
