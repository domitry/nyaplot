(function (root, initialize){
    var Nyaplot = initialize();
    if(typeof define !== "undefined" && define.amd)define(Nyaplot);
    root.Nyaplot = Nyaplot;
}(this, function(){
    //modules here
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../contrib/almond/almond", function(){});

//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

/*
 * Manager:
 *
 * Manager is the overall frame manager that holds plots and datasources (DataFrame).
 *
 */

define('core/manager',[
    "underscore"
], function(_){
    var Manager = {data_frames: {}, panes: []};

    // add a data source (DataFrame) by name
    Manager.addData = function(name, df){
        var entry = {};
        entry[name] = df;
        _.extend(this.data_frames, entry);
    };

    // Fetch a data source by name
    Manager.getData = function(name){
        return this.data_frames[name];
    };

    // Add a pane to the manager
    Manager.addPane = function(pane){
        this.panes.push(pane);
    };

    // Update and redraw the panes
    Manager.update = function(uuid){
        if(arguments.length>0){
            var entries = _.filter(this.panes, function(entry){return entry.uuid==uuid;});
            _.each(entries, function(entry){
                entry.pane.update();
            });
        }else{
            _.each(this.panes, function(entry){
                entry.pane.update();
            });
        }
    };

    return Manager;
});

//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(require) == 'function') {
    try {
      var _rb = require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define('node-uuid',[],function() {return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

/*
 * SimpleLegend: The simplest legend objects
 *
 * SimpleLegend provides legend consists of simple circle buttons and labels.
 *
 * options(summary)
 *    title_height -> Float : height of title text.
 *    mode         -> String: 'normal' and 'radio' are allowed.
 *
 * example: 
 *    http://bl.ocks.org/domitry/e9a914b78f3a576ed3bb
 */

define('view/components/legend/simple_legend',[
    'underscore',
    'core/manager'
],function(_, Manager){
    function SimpleLegend(data, _options){
        var options = {
            title: '',
            width: 150,
            height: 22,
            title_height: 15,
            mode: 'normal'
        };
        if(arguments.length>1)_.extend(options, _options);

        this.model = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"));
        this.options = options;
        this.data = data;

        return this;
    }

    SimpleLegend.prototype.width = function(){
        return this.options.width;
    };

    SimpleLegend.prototype.height = function(){
        return this.options.height * (this.data.length);
    };

    // Create dom object independent form pane or context and return it. called by each diagram.o
    SimpleLegend.prototype.getDomObject = function(){
        var model = this.model;
        var options = this.options;

        model.append("text")
            .attr("x", 12)
            .attr("y", options.height)
            .attr("font-size","14")
            .text(options.title);

        var entries = this.model.selectAll("g")
                .data(this.data)
                .enter()
                .append("g");

        var circle = entries
                .append("circle")
                .attr("cx","8")
                .attr("cy",function(d, i){return options.height*(i+1);})
                .attr("r","6")
                .attr("stroke", function(d){return d.color;})
                .attr("stroke-width","2")
                .attr("fill",function(d){return d.color;})
                .attr("fill-opacity", function(d){return (d.mode=='off' ? 0 : 1);});

        switch(options.mode){
            case 'normal':
            circle
                .on("click", function(d){
                    if(!(!d['on'] && !d['off'])){
                        var el = d3.select(this);
                        if(el.attr("fill-opacity")==1){
                            el.attr("fill-opacity", 0);
                            d.off();
                        }else{
                            el.attr("fill-opacity", 1);
                            d.on();
                        };
                    }
                });
            break;
            case 'radio':
            circle.on("click", function(d){
                var el = d3.select(this);
                if(el.attr("fill-opacity")==0){
                    var thisObj = this;
                    circle.filter(function(d){return (this!=thisObj && !(!d['on'] && !d['off']));})
                        .attr("fill-opacity", 0);
                    el.attr("fill-opacity", 1);
                    d.on();
                }
            });
            break;
        }

        circle.style("cursor", function(d){
            if(d['on'] == undefined && d['off'] == undefined)return "default";
            else return "pointer";
        });
        
        entries.append("text")
            .attr("x","18")
            .attr("y",function(d,i){return options.height*(i+1)+4;})
            .attr("font-size","12")
            .text(function(d){return d.label;});

        return model;
    };

    return SimpleLegend;
});

/*
 * Bar chart
 *
 * This diagram has two mode, ordinal-mode and count-mode. The former creates bar from x and y column.
 * The latter counts unique value in 'value' column and generates bar from the result.
 * 
 *
 * options:
 *    value   -> String: column name. set when you'd like to build bar chart based on one-dimention data
 *    x, y    -> String: column name. x should be discrete. y should be continuous.
 *    width   -> Float : 0..1, width of each bar.
 *    color   -> Array : color in which bars filled.
 *    hover   -> Bool  : set whether pop-up tool-tips when bars are hovered.
 *    tooltip -> Object: instance of Tooltip. set by pane.
 *
 * example:
 *    specified 'value' option : http://bl.ocks.org/domitry/b8785f02f36deef567ce
 *    specified 'x' and 'y' : http://bl.ocks.org/domitry/2f53781449025f772676
 */

define('view/diagrams/bar',[
    'underscore',
    'node-uuid',
    'core/manager',
    'view/components/legend/simple_legend'
],function(_, uuid, Manager, SimpleLegend){
    function Bar(parent, scales, df_id, _options){
        var options = {
            value: null,
            x: null,
            y: null,
            width: 0.9,
            color: null,
            hover: true,
            tooltip_contents:null,
            tooltip:null,
            legend: true
        };
        if(arguments.length>3)_.extend(options, _options);

        var df = Manager.getData(df_id);

        var color_scale;
        if(options.color == null) color_scale = d3.scale.category20b();
        else color_scale = d3.scale.ordinal().range(options.color);
        this.color_scale = color_scale;

        var model = parent.append("g");

        var legend_data = [], labels;

        if(options.value != null){
            var column_value = df.column(options.value);
            labels = _.uniq(column_value);
        }else
            labels = df.column(options.x);
        
        _.each(labels, function(label){
            legend_data.push({label: label, color:color_scale(label)});
        });

        this.model = model;
        this.scales = scales;
        this.options = options;
        this.legend_data = legend_data;
        this.df = df;
        this.df_id = df_id;
        this.uuid = options.uuid;

        return this;
    }

    // fetch data and update dom object. called by pane which this chart belongs to.
    Bar.prototype.update = function(){
        var data;
        if(this.options.value !== null){
            var column_value = this.df.columnWithFilters(this.uuid, this.options.value);
            var raw = this.countData(column_value);
            data = this.processData(raw.x, raw.y, this.options);
        }else{
            var column_x = this.df.columnWithFilters(this.uuid, this.options.x);
            var column_y = this.df.columnWithFilters(this.uuid, this.options.y);
            data = this.processData(column_x, column_y, this.options);
        }

        var rects = this.model.selectAll("rect").data(data);
        rects.enter().append("rect")
            .attr("height", 0)
            .attr("y", this.scales.get(0, 0).y);

        this.updateModels(rects, this.scales, this.options);
    };
    
    // process data as:
    //     x: [1,2,3,...], y: [4,5,6,...] -> [{x: 1, y: 4},{x: 2, y: 5},...]
    Bar.prototype.processData = function(x, y, options){
        return _.map(_.zip(x,y),function(d, i){return {x:d[0], y:d[1]};});
    };

    // update dom object
    Bar.prototype.updateModels = function(selector, scales, options){
        var color_scale = this.color_scale;

        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d3.rgb(color_scale(d.x)).darker(1);});
            var id = d3.select(this).attr("id");
            options.tooltip.addToYAxis(id, this.__data__.y);
            options.tooltip.update();
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return color_scale(d.x);});
            var id = d3.select(this).attr("id");
            options.tooltip.reset();
        };

        var width = scales.raw.x.rangeBand()*options.width;
        var padding = scales.raw.x.rangeBand()*((1-options.width)/2);

        selector
            .attr("x",function(d){return scales.get(d.x, d.y).x + padding;})
            .attr("width", width)
            .attr("fill", function(d){return color_scale(d.x);})
            .transition().duration(200)
            .attr("y", function(d){return scales.get(d.x, d.y).y;})
            .attr("height", function(d){return scales.get(0, 0).y - scales.get(0, d.y).y;})
            .attr("id", uuid.v4());

        if(options.hover)selector
            .on("mouseover", onMouse)
            .on("mouseout", outMouse);
    };

    // return legend object based on data prepared by initializer
    Bar.prototype.getLegend = function(){
        var legend = new SimpleLegend((this.options.legend ? this.legend_data : {}));
        return legend;
    };

    // count unique value. called when 'value' option was specified insead of 'x' and 'y'
    Bar.prototype.countData = function(values){
        var hash = {};
        _.each(values, function(val){
            hash[val] = hash[val] || 0;
            hash[val] += 1;
        });
        return {x: _.keys(hash), y: _.values(hash)};
    };

    // not implemented yet.
    Bar.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Bar;
});

/*
 * Filter:
 * 
 * Filtering data according to box on context area. Filter is implemented using d3.svg.brush().
 * See the website of d3.js to learn more: https://github.com/mbostock/d3/wiki/SVG-Controls
 *
 * options (summary) :
 *    opacity -> Float : Opacity of filtering area
 *    color   -> String: Color of filtering area
 *
 * example :
 *    http://bl.ocks.org/domitry/b8785f02f36deef567ce
 */

define('view/components/filter',[
    'underscore',
    'core/manager'
],function(_, Manager){

    function Filter(parent, scales, callback, _options){
        var options = {
            opacity: 0.125,
            color: 'gray'
        };
        if(arguments.length>2)_.extend(options, _options);

        var brushed = function(){
            var ranges = {
                x: (brush.empty() ? scales.domain().x : brush.extent()),
                y: scales.domain().y
            };
            callback(ranges);
        };

        var brush = d3.svg.brush()
                .x(scales.raw.x)
                .on("brushend", brushed);

        var model = parent.append("g");
        var height = d3.max(scales.range().y) - d3.min(scales.range().y);
        var y = d3.min(scales.range().y);

        model.call(brush)
            .selectAll("rect")
            .attr("y", y)
            .attr("height", height)
            .style("fill-opacity", options.opacity)
            .style("fill", options.color)
            .style("shape-rendering", "crispEdges");
        
        return this;
    }

    return Filter;
});

/*
 * Histogram: Histogram
 *
 * Caluculate hights of each bar from column specified by 'value' option and create histogram.
 * See the page of 'd3.layout.histogram' on d3.js's website to learn more. (https://github.com/mbostock/d3/wiki/Histogram-Layout)
 * 
 *
 * options:
 *    value        -> String: column name. Build histogram based on this data.
 *    bin_num      -> Float : number of bin
 *    width        -> Float : 0..1, width of each bar.
 *    color        -> Array : color in which bars filled.
 *    stroke_color -> String: stroke color
 *    stroke_width -> Float : stroke width
 *    hover        -> Bool  : set whether pop-up tool-tips when bars are hovered.
 *    tooltip      -> Object: instance of Tooltip. set by pane.
 *
 * example:
 *    http://bl.ocks.org/domitry/f0e3f5c91cb83d8d715e
 */

define('view/diagrams/histogram',[
    'underscore',
    'node-uuid',
    'core/manager',
    'view/components/filter',
    'view/components/legend/simple_legend'
],function(_, uuid, Manager, Filter, SimpleLegend){
    function Histogram(parent, scales, df_id, _options){
        var options = {
            title: 'histogram',
            value: null,
            bin_num: 20,
            width: 0.9,
            color:'steelblue',
            stroke_color: 'black',
            stroke_width: 1,
            hover: true,
            tooltip:null,
            legend: true
        };
        if(arguments.length>3)_.extend(options, _options);

        var df = Manager.getData(df_id);
        var model = parent.append("g");

        this.scales = scales;
        this.legends = [{label: options.title, color:options.color}];
        this.options = options;
        this.model = model;
        this.df = df;
        this.uuid = options.uuid;
        
        return this;
    }

    // fetch data and update dom object. called by pane which this chart belongs to.
    Histogram.prototype.update = function(){
        var column_value = this.df.columnWithFilters(this.uuid, this.options.value);
        var data = this.processData(column_value, this.options);

        var models = this.model.selectAll("rect").data(data);
        models.enter().append("rect").attr("height", 0).attr("y", this.scales.get(0, 0).y);
        this.updateModels(models,  this.scales, this.options);
    };

    // pre-process data using function embeded in d3.js.
    Histogram.prototype.processData = function(column, options){
        return d3.layout.histogram()
            .bins(this.scales.raw.x.ticks(options.bin_num))(column);
    };

    // update SVG dom nodes based on pre-processed data.
    Histogram.prototype.updateModels = function(selector, scales, options){
        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", d3.rgb(options.color).darker(1));
            var id = d3.select(this).attr("id");
            options.tooltip.addToYAxis(id, this.__data__.y, 3);
            options.tooltip.update();
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", options.color);
            var id = d3.select(this).attr("id");
            options.tooltip.reset();
        };

        selector
            .attr("x",function(d){return scales.get(d.x, 0).x;})
            .attr("width", function(d){return scales.get(d.dx, 0).x - scales.get(0, 0).x;})
            .attr("fill", options.color)
            .attr("stroke", options.stroke_color)
            .attr("stroke-width", options.stroke_width)
            .transition().duration(200)
            .attr("y", function(d){return scales.get(0, d.y).y;})
            .attr("height", function(d){return scales.get(0, 0).y - scales.get(0, d.y).y;})
            .attr("id", uuid.v4());
        
        if(options.hover)selector
            .on("mouseover", onMouse)
            .on("mouseout", outMouse);
    };

    // return legend object.
    Histogram.prototype.getLegend = function(){
        var legend = new SimpleLegend((this.options.legend ? this.legend_data : {}));
        return legend;
    };

    // answer to callback coming from filter.
    Histogram.prototype.checkSelectedData = function(ranges){
        var label_value = this.options.value;
        var filter = function(row){
            var val = row[label_value];
            if(val > ranges.x[0] && val < ranges.x[1])return true;
            else return false;
        };
        this.df.addFilter(this.uuid, filter, ['self']);
        Manager.update();
    };

    return Histogram;
});

/*
 * Scatter: Scatter and Bubble chart
 *
 * Scatter chart. This can create bubble chart when specified 'size_by' option.
 * Tooltip, fill_by, size_by options should be implemented to other charts refering to this chart.
 *
 *
 * options:
 *    x,y             -> String: column name. both of continuous and descrete data are allowed.
 *    fill_by         -> String: column name. Fill vectors according to this column. (c/d are allowd.)
 *    shape_by        -> String: column name. Fill vectors according to this column. (d is allowd.)
 *    size_by         -> String: column name. Fill vectors according to this column. (c/d are allowd.)
 *    color           -> Array : Array of String.
 *    shape           -> Array : Array of String.
 *    size            -> Array : Array of Float. specified when creating bubble chart.
 *    stroke_color    -> String: stroke color.
 *    stroke_width    -> Float : stroke width.
 *    hover           -> Bool  : set whether pop-up tool-tips when bars are hovered.
 *    tooltip-contents-> Array : Array of column name. Used to create tooltip on points when hovering them.
 *    tooltip         -> Object: instance of Tooltip. set by pane.
 *
 * example:
 *    http://bl.ocks.org/domitry/78e2a3300f2f27e18cc8
 *    http://bl.ocks.org/domitry/308e27d8d12c1374e61f
 */

define('view/diagrams/scatter',[
    'underscore',
    'node-uuid',
    'core/manager',
    'view/components/filter',
    'view/components/legend/simple_legend'
],function(_, uuid, Manager, Filter, SimpleLegend){
    function Scatter(parent, scales, df_id, _options){
        var options = {
            title: 'scatter',
            x: null,
            y: null,
            fill_by: null,
            shape_by: null,
            size_by: null,
            color:['#4682B4', '#000000'],
            shape:['circle','triangle-up', 'diamond', 'square', 'triangle-down', 'cross'],
            size: [100, 1000],
            stroke_color: 'black',
            stroke_width: 1,
            hover: true,
            tooltip_contents:[],
            tooltip:null,
            legend :true
        };
        if(arguments.length>3)_.extend(options, _options);

        this.scales = scales;
        var df = Manager.getData(df_id);
        var model = parent.append("g");

        this.legend_data = (function(thisObj){
            var on = function(){
                thisObj.render = true;
                thisObj.update();
            };

            var off = function(){
                thisObj.render = false;
                thisObj.update();
            };
            return [{label: options.title, color:options.color, on:on, off:off}];
        })(this);

        this.render = true;
        this.options = options;
        this.model = model;
        this.df = df;
        this.uuid = options.uuid;

        return this;
    }

    // fetch data and update dom object. called by pane which this chart belongs to.
    Scatter.prototype.update = function(){
        var data = this.processData(this.options);
        this.options.tooltip.reset();
        if(this.render){
            var shapes = this.model.selectAll("path").data(data);
            shapes.enter().append("path");
            this.updateModels(shapes, this.scales, this.options);
        }else{
            this.model.selectAll("path").remove();
        }
    };

    // pre-process data like: [{x: 1, y: 2, fill: '#000', size: 20, shape: 'triangle-up'}, {},...,{}]
    Scatter.prototype.processData = function(options){
        var df = this.df;
        var labels = ['x', 'y', 'fill', 'size', 'shape'];
        var columns = _.map(['x', 'y'], function(label){return df.column(options[label]);});
        var length = columns[0].length;

        _.each([{column: 'fill_by', val: 'color'}, {column: 'size_by', val: 'size'}, {column: 'shape_by', val: 'shape'}], function(info){
            if(options[info.column]){
                var scale = df.scale(options[info.column], options[info.val]);
                columns.push(_.map(df.column(options[info.column]), function(val){return scale(val);}));
            }else{
                columns.push(_.map(_.range(1, length+1, 1), function(d){
                    if(_.isArray(options[info.val]))return options[info.val][0];
                    else return options[info.val];
                }));
            }
        });
/*
        this.optional_scales = _.reduce([{column: 'fill_by', val: 'color'}, {column: 'size_by', val: 'size'}, {column: 'shape_by', val: 'shape'}], function(memo, info){
            if(options[info.column]){
                var scale = df.scale(options[info.column], options[info.val]);
                columns.push(_.map(df.column(options[info.column]), function(val){return scale(val);}));
                memo[info.val] = scale;
            }else{
                columns.push(_.map(_.range(1, length+1, 1), function(d){
                    if(_.isArray(options[info.val]))return options[info.val][0];
                    else return options[info.val];
                }));
                memo[info.val] = d3.scale.ordinal().range(columns.last[0]);
            }
        }, {});*/

        if(options.tooltip_contents.length > 0){
            var tt_arr = df.getPartialDf(options.tooltip_contents);
            labels.push('tt');
            columns.push(tt_arr);
        }

        return _.map(_.zip.apply(null, columns), function(d){
            return _.reduce(d, function(memo, val, i){memo[labels[i]] = val; return memo;}, {});
        });
    };

    // update SVG dom nodes based on pre-processed data.
    Scatter.prototype.updateModels = function(selector, scales, options){
        var id = this.uuid;

        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d3.rgb(d.fill).darker(1);});
            options.tooltip.addToXAxis(id, this.__data__.x, 3);
            options.tooltip.addToYAxis(id, this.__data__.y, 3);
            if(options.tooltip_contents.length > 0){
                options.tooltip.add(id, this.__data__.x, this.__data__.y, 'top', this.__data__.tt);
            }
            options.tooltip.update();
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d.fill;});
            options.tooltip.reset();
        };

        selector
            .attr("transform", function(d) {
                return "translate(" + scales.get(d.x, d.y).x + "," + scales.get(d.x, d.y).y + ")"; })
            .attr("fill", function(d){return d.fill;})
            .attr("stroke", options.stroke_color)
            .attr("stroke-width", options.stroke_width)
            .transition().duration(200)
            .attr("d", d3.svg.symbol().type(function(d){return d.shape;}).size(function(d){return d.size;}));

        if(options.hover)selector
            .on("mouseover", onMouse)
            .on("mouseout", outMouse);
    };

    // return legend object.
    Scatter.prototype.getLegend = function(){
        /*
        var opt_data = this.optional_scales, color='';
        var defaults = _.map([{name: 'color', default: '#fff'}, {name: 'shape', default: 'shape'}, {name: 'size', default: 30}], function(info){
            if(opt_data[info.name].range().length == 1)return opt_data[info.name].range()[0];
            else return info.default;
        });
        // color
        switch(opt_data['color'].range().length){
            
        }
        
        // size
        */

        var legend = new SimpleLegend((this.options.legend ? this.legend_data : {}));
        return legend;
    };

    // answer to callback coming from filter.
    Scatter.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Scatter;
});

/*
 * Line: Line chart
 *
 * Attention: 'Line' is totally designed to be used to visualize line chart for Mathematics. So it is not useful to visualize statistical data like stock price.
 * If you feel so, feel free to add options like 'shape', 'shape_by' and 'fill_by' to this chart and send pull-request.
 * Please be sure to refer to the code of other chart like scatter at that time.
 *
 *
 * options:
 *    title        -> String: title of this chart showen on legend
 *    x,y          -> String: column name.
 *    color        -> Array : color in which line is filled.
 *    stroke_width -> Float : stroke width.
 *
 * example:
 *    http://bl.ocks.org/domitry/e9a914b78f3a576ed3bb
 */

define('view/diagrams/line',[
    'underscore',
    'core/manager',
    'view/components/filter',
    'view/components/legend/simple_legend'
],function(_, Manager, Filter, SimpleLegend){
    function Line(parent, scales, df_id, _options){
        var options = {
            title: 'line',
            x: null,
            y: null,
            color:'steelblue',
            fill_by : null,
            stroke_width: 2,
            legend: true
        };
        if(arguments.length>3)_.extend(options, _options);

        this.scales = scales;
        var df = Manager.getData(df_id);
        var model = parent.append("g");

        this.legend_data = (function(thisObj){
            var on = function(){
                thisObj.render = true;
                thisObj.update();
            };

            var off = function(){
                thisObj.render = false;
                thisObj.update();
            };
            return [{label: options.title, color:options.color, on:on, off:off}];
        })(this);

        this.render = true;
        this.options = options;
        this.model = model;
        this.df = df;
        this.df_id = df_id;

        return this;
    }

    // fetch data and update dom object. called by pane which this chart belongs to.
    Line.prototype.update = function(){
        if(this.render){
            var data = this.processData(this.df.column(this.options.x), this.df.column(this.options.y), this.options);
            this.model.selectAll("path").remove();
            var path =this.model
                    .append("path")
                    .datum(data);
            
            this.updateModels(path, this.scales, this.options);
        }else{
            this.model.selectAll("path").remove();
        }
    };

    // pre-process data like: x: [1,3,..,3], y: [2,3,..,4] -> [{x: 1, y: 2}, ... ,{}]
    Line.prototype.processData = function(x_arr, y_arr, options){
        var df = this.df, length = x_arr.length;
        /*
        var color_arr = (function(column, colors){
            if(options['fill_by']){
                var scale = df.scale(options[column], options[colors]);
                return _.map(df.column(options[column]), function(val){return scale(val);});
            }else{
                return _.map(_.range(1, length+1, 1), function(d){
                    if(_.isArray(options[colors]))return options[colors][0];
                    else return options[colors];
                });
            }
        })('fill_by', 'color');*/
        return _.map(_.zip(x_arr, y_arr), function(d){return {x:d[0], y:d[1]};});
    };

    // update SVG dom nodes based on pre-processed data.
    Line.prototype.updateModels = function(selector, scales, options){
        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", d3.rgb(options.color).darker(1));
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", options.color);
        };

        var line = d3.svg.line()
                .x(function(d){return scales.get(d.x, d.y).x;})
                .y(function(d){return scales.get(d.x, d.y).y;});

        selector
            .attr("d", line)
            .attr("stroke", options.color)
            .attr("stroke-width", options.stroke_width)
            .attr("fill", "none");
    };

    // return legend object.
    Line.prototype.getLegend = function(){
        var legend = new SimpleLegend((this.options.legend ? this.legend_data : []));
        return legend;
    };

    // answer to callback coming from filter.
    Line.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Line;
});

/*
 * Simplex:
 *
 * Implementation of downhill simplex method.
 * See Wikipedia: http://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method
 */


define('utils/simplex',['underscore'], function(_){
    var l_1 = 0.7, l_2 = 1.5;
    var EPS = 1.0e-20;
    var count = 0, COUNT_LIMIT=2000;

    function calcCenter(vector){
        var center = [];
        _.each(_.zip.apply(null, vector), function(arr, i){
            center[i] = 0;
            _.each(arr, function(val){
                center[i] += val;
            });
            center[i] = center[i]/arr.length;
        });
        return center;
    }

    function rec(params, func){
        params = _.sortBy(params, function(p){return func(p);});
        var n = params.length;
        var val_num = params[0].length;
        var p_h = params[n-1];
        var p_g = params[n-2];
        var p_l = params[0];
        var p_c = calcCenter(params.concat().splice(0, n-1));
        var p_r = [];
        for(var i=0; i<val_num; i++)p_r[i]=2*p_c[i] - p_h[i];

        if(func(p_r) >= func(p_h)){
            // reduction
            for(var i=0;i<val_num;i++)
                params[n-1][i] = (1 - l_1)*p_h[i] + l_1 * p_r[i];
        }else if(func(p_r) < (func(p_l)+(l_2 - 1)*func(p_h))/l_2){
            // expand
            var p_e = [];
            for(var i=0;i<val_num;i++)p_e[i] = l_2*p_r[i] - (l_2 -1)*p_h[i];
            if(func(p_e) <= func(p_r))params[n-1] = p_e;
            else params[n-1] = p_r;
        }else{
            params[n-1] = p_r;
        }

        if(func(params[n-1]) >=  func(p_g)){
            // reduction all
            _.each(params, function(p, i){
                for(var j=0;j<val_num;j++){
                    params[i][j] = 0.5*(p[j] + p_l[j]);
                }
            });
        }
        var sum = 0;
        _.each(params, function(p){sum += Math.pow(func(p) - func(p_l),2);});

        if(sum < EPS)return params[n-1];
        else{
            count++;
            if(count > COUNT_LIMIT)return params[n-1];
            return rec(params, func);
        }
    }

    function simplex(params, func){
        var k = 1;
        var n = params.length;
        var p_default = [params];
        _.each(_.range(n), function(i){
            var p = params.concat();
            p[i] += k;
            p_default.push(p);
        });
        return rec(p_default, func);
    }

    return simplex;
});

/*
 * Venn: 3-way venn diagram
 *
 * The implementation of traditional 3-way venn diagram. This chart is designed to work with histogram and bar chart. (See example at the bottom of this comment.)
 * The overlapping areas are automatically changed according to common values in each pair of group. The calculation is excuted with downhill simplex method.
 * Attention: This is still experimental implementation and should be modernized. Feel free to re-write the code below and send pull-request.
 *
 *
 * options:
 *    category, count-> String: Column name.
 *    color          -> Array : Array of String. Colors in which circles are filled.
 *    stroke_color   -> String: stroke color.
 *    stroke_width   -> Float : stroke width.
 *    hover          -> Bool  : set whether pop-up tool-tips when bars are hovered.
 *    area_names     -> Array : Array of String. Names for each groups.
 *    filter_control -> Bool  : Wheter to display controller for filtering. See the second example below.
 *
 * example:
 *    http://bl.ocks.org/domitry/d70dff56885218c7ad9a
 *    http://www.domitry.com/gsoc/multi_pane2.html
 */

define('view/diagrams/venn',[
    'underscore',
    'core/manager',
    'view/components/filter',
    'view/components/legend/simple_legend',
    'utils/simplex'
],function(_, Manager, Filter, SimpleLegend, simplex){
    function Venn(parent, scales, df_id, _options){
        var options = {
            category: null,
            count: null,
            color:null,
            stroke_color:'#000',
            stroke_width: 1,
            opacity: 0.7,
            hover: false,
            area_names:['VENN1','VENN2','VENN3'],
            filter_control:false
        };
        if(arguments.length>3)_.extend(options, _options);

        var df = Manager.getData(df_id);
        var model = parent.append("g");

        var column_category = df.column(options.category);
        var categories = _.uniq(column_category);
        var color_scale;

        if(options.color == null)color_scale = d3.scale.category20().domain(options.area_names);
        else color_scale = d3.scale.ordinal().range(options.color).domain(options.area_names);
        this.color_scale = color_scale;

        var legend_data = [];
        var selected_category = [[categories[0]], [categories[1]], [categories[2]]];

        var update = this.update, tellUpdate = this.tellUpdate;
        var thisObj = this;

        for(var i=0;i<3;i++){
            var entry = [];
            entry.push({label: options.area_names[i], color:color_scale(options.area_names[i])});
            _.each(categories, function(category){
                var venn_id = i;
                var on = function(){
                    selected_category[venn_id].push(category);
                    update.call(thisObj);
                    tellUpdate.call(thisObj);
                };
                var off = function(){
                    var pos = selected_category[venn_id].indexOf(category);
                    selected_category[venn_id].splice(pos, 1);
                    update.call(thisObj);
                    tellUpdate.call(thisObj);
                };
                var mode = (category == selected_category[i] ? 'on' : 'off');
                entry.push({label: category, color:'black', mode:mode, on:on, off:off});
            });
            legend_data.push(new SimpleLegend(entry));
        }

        var filter_mode = 'all';
        if(options.filter_control){
            var entry = [];
            var modes = ['all', 'overlapping', 'non-overlapping'];
            var default_mode = filter_mode;

            entry.push({label:'Filter', color:'gray'});
            _.each(modes, function(mode){
                var on = function(){
                    thisObj.filter_mode = mode;
                    update.call(thisObj);
                    tellUpdate.call(thisObj);
                };
                var on_off = (mode==default_mode?'on':'off');
                entry.push({label:mode, color:'black', on:on, off:function(){},mode:on_off});
            });
            legend_data.push(new SimpleLegend(entry, {mode:'radio'}));
        }

        this.selected_category = selected_category;
        this.filter_mode = filter_mode;
        this.legend_data = legend_data;
        this.options = options;
        this.scales = scales;
        this.model = model;
        this.df_id = df_id;
        this.df = df;
        this.uuid = options.uuid;

        this.tellUpdate();

        return this;
    }

    // X->x, Y->y scales given by pane is useless when creating venn diagram, so create new scale consists of x, y, and r.
    Venn.prototype.getScales = function(data, scales){
        var r_w = _.max(scales.range().x) - _.min(scales.range().x);
        var r_h = _.max(scales.range().y) - _.min(scales.range().y);
        var d_x = {
            min: (function(){var min_d = _.min(data.pos, function(d){return d.x - d.r;}); return min_d.x - min_d.r;})(),
            max: (function(){var max_d = _.max(data.pos, function(d){return d.x + d.r;}); return max_d.x + max_d.r;})()
        };
        var d_y = {
            min: (function(){var min_d = _.min(data.pos, function(d){return d.y - d.r;}); return min_d.y - min_d.r;})(),
            max: (function(){var max_d = _.max(data.pos, function(d){return d.y + d.r;}); return max_d.y + max_d.r;})()
        };
        var d_w = d_x.max-d_x.min;
        var d_h = d_y.max-d_y.min;

        var scale = 0;
        if(r_w/r_h > d_w/d_h){
            scale = d_h/r_h;
            var new_d_w = scale*r_w;
            d_x.min -= (new_d_w - d_w)/2;
            d_x.max += (new_d_w - d_w)/2;
        }
        else{
            scale = d_w/r_w;
            var new_d_h = scale*r_h;
            d_h.min -= (new_d_h - d_h)/2;
            d_h.max += (new_d_h - d_h)/2;
        }
        var new_scales = {};
        new_scales.x = d3.scale.linear().range(scales.range().x).domain([d_x.min, d_x.max]);
        new_scales.y = d3.scale.linear().range(scales.range().y).domain([d_y.min, d_y.max]);
        new_scales.r = d3.scale.linear().range([0,100]).domain([0,100*scale]);
        return new_scales;
    };

    // fetch data and update dom objects.
    Venn.prototype.update = function(){
        var column_count = this.df.columnWithFilters(this.uuid, this.options.count);
        var column_category = this.df.columnWithFilters(this.uuid, this.options.category);

        var data = this.processData(column_category, column_count, this.selected_category);
        var scales = this.getScales(data, this.scales);
        var circles = this.model.selectAll("circle").data(data.pos);
        var texts = this.model.selectAll("text").data(data.labels);

        if(circles[0][0]==undefined)circles = circles.enter().append("circle");
        if(texts[0][0]==undefined)texts = texts.enter().append("text");

        this.counted_items = data.counted_items;
        this.updateModels(circles, scales, this.options);
        this.updateLabels(texts, scales, this.options);
    };

    // Calculate overlapping areas at first, and then decide center point of each circle with simplex module.
    Venn.prototype.processData = function(category_column, count_column, selected_category){
        // decide overlapping areas
        var items = (function(){
            var table = [];
            var counted_items = (function(){
                var hash={};
                _.each(_.zip(category_column, count_column), function(arr){
                    if(hash[arr[1]]==undefined)hash[arr[1]]={};
                    _.each(selected_category, function(category, i){
                        if(category.indexOf(arr[0])!=-1)hash[arr[1]][i] = true;
                    });
                });
                return hash;
            })();

            var count_common = function(items){
                var cnt=0;
                _.each(_.values(counted_items), function(values, key){
                    if(!_.some(items, function(item){return !(item in values);}))cnt++;
                });
                return cnt;
            };
            
            for(var i = 0; i<3; i++){
                table[i] = [];
                table[i][i] = count_common([i]);
                for(var j=i+1; j<3; j++){
                    var num = count_common([i, j]);
                    table[i][j] = num;
                }
            }
            return {table:table,counted_items:counted_items};
        })();
        var table=items.table;
        var counted_items=items.counted_items;

        // decide radius of each circle
        var r = _.map(table, function(row, i){
            return Math.sqrt(table[i][i]/(2*Math.PI));
        });

        // function for minimizing loss of overlapping (values: x1,y1,x1,y1...)
        var evaluation = function(values){
            var loss = 0;
            for(var i=0;i<values.length;i+=2){
                for(var j=i+2;j<values.length;j+=2){
                    var x1=values[i], y1=values[i+1], x2=values[j], y2=values[j+1];
                    var r1=r[i/2], r2=r[j/2];
                    var d = Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
                    var S = 0;
                    if(d > r1+r2)S = 0;
                    else{
                        _.each([[r1, r2],[r2, r1]], function(r_arr){
                            var theta = Math.acos((r_arr[1]*r_arr[1] - r_arr[0]*r_arr[0] + d*d)/(2*r_arr[1]*d));
                            var s = r_arr[i]*r_arr[i]*theta - (1/2)*r_arr[1]*r_arr[1]*Math.sin(theta*2);
                            S += s;
                        });
                    }
                    loss += Math.pow(table[i/2][j/2]-S,2);
                }
            }
            return loss;
        };

        // decide initial paramaters
        var init_params = (function(){
            var params = [];
            var set_num = table[0].length;
            var max_area = _.max(table, function(arr, i){
                // calc the sum of overlapping area
                var result=0;
                for(var j=0;j<i;j++)result+=table[j][i];
                for(var j=i+1;j<arr.length;j++)result+=table[i][j];
                return result;
            });
            var center_i = set_num - max_area.length;
            params[center_i*2] = 0; // x
            params[center_i*2+1] = 0; // y
            var rad=0, rad_interval=Math.PI/(1.5*(set_num-1));
            for(var i=0;i<set_num;i++){
                if(i!=center_i){
                    var d = r[center_i] + r[i]/2;
                    params[i*2] = d*Math.sin(rad);
                    params[i*2+1] = d*Math.cos(rad);
                    rad += rad_interval;
                }
            }
            return params;
        })();

        // decide coordinates using Simplex method
        var params = simplex(init_params, evaluation);
        var pos=[], labels=[];
        for(var i=0;i<params.length;i+=2)
            pos.push({x:params[i] ,y:params[i+1], r:r[i/2], id:i});

        for(var i=0;i<3;i++){
            labels.push({x: params[i*2], y: params[i*2+1], val: table[i][i]});
            for(var j=i+1;j<3;j++){
                var x = (params[i*2] + params[j*2])/2;
                var y = (params[i*2+1] + params[j*2+1])/2;
                labels.push({x: x, y: y, val: table[i][j]});
            }
        }

        return {pos:pos, labels:labels, counted_items:counted_items};
    };

    // update dom objects according to pre-processed data.
    Venn.prototype.updateModels = function(selector, scales, options){
        var color_scale = this.color_scale;
        var area_names = this.options.area_names;

        selector
            .attr("cx", function(d){return scales.x(d.x);})
            .attr("cy", function(d){return scales.y(d.y);})
            .attr("stroke", options.stroke_color)
            .attr("stroke-width", options.stroke_width)
            .attr("fill", function(d){return color_scale(area_names[d.id]);})
            .attr("fill-opacity", options.opacity)
            .transition()
            .duration(500)
            .attr("r", function(d){return scales.r(d.r);});

        if(options.hover){
            var onMouse = function(){
                d3.select(this).transition()
                    .duration(200)
                    .attr("fill", function(d){return d3.rgb(color_scale(area_names[d.id])).darker(1);});
            };

            var outMouse = function(){
                d3.select(this).transition()
                    .duration(200)
                    .attr("fill", function(d){return color_scale(area_names[d.id]);});
            };
            
            selector
                .on("mouseover", onMouse)
                .on("mouseout", outMouse);
        }
    };

    // update labels placed the center point between each pair of circle.
    Venn.prototype.updateLabels = function(selector, scales, options){
        selector
            .attr("x", function(d){return scales.x(d.x);})
            .attr("y", function(d){return scales.y(d.y);})
            .attr("text-anchor", "middle")
            .text(function(d){return String(d.val);});
    };

    // return legend object.
    Venn.prototype.getLegend = function(){
        return this.legend_data;
    };

    // tell update to Manager when venn recieved change from filter controller.
    Venn.prototype.tellUpdate = function(){
        var rows=[], selected_category = this.selected_category;
        var counted_items = this.counted_items;
        var filter_mode = this.filter_mode;
        var category_num = this.options.category;
        var count_num = this.options.count;
        var filter = {
            'all':function(row){
                // check if this row in in any area (VENN1, VENN2, VENN3,...)
                return _.some(selected_category, function(categories){
                    if(categories.indexOf(row[category_num])!=-1)return true;
                    else return false;
                });
            },
            'overlapping':function(row){
                if(!_.some(selected_category, function(categories){
                    if(categories.indexOf(row[category_num])!=-1)return true;
                    else return false;
                }))return false;

                for(var i=0;i<3;i++){
                    for(var j=i+1;j<3;j++){
                        if( 
                            counted_items[row[count_num]][i]
                                && counted_items[row[count_num]][j]
                        )return true;
                    }
                }
                return false;
            },
            'non-overlapping':function(row){
                if(!_.some(selected_category, function(categories){
                    if(categories.indexOf(row[category_num])!=-1)return true;
                    else return false;
                }))return false;

                for(var i=0;i<3;i++){
                    for(var j=i+1;j<3;j++){
                        if(counted_items[row[count_num]][i]
                           && counted_items[row[count_num]][j]
                          )return false;
                    }
                }
                return true;
            }
        }[filter_mode];
        this.df.addFilter(this.uuid, filter, ['self']);
        Manager.update();
    };

    return Venn;
});

/*
 * Venn: Venn diagram consisted in 3> circles
 *
 * Attention -- this chart is not supported yet. Please send pull-req if you are interested in re-implementing this chart.
 *    See src/view/diagrams/venn.js to learn more.
 */

define('view/diagrams/multiple_venn',[
    'underscore',
    'core/manager',
    'view/components/filter',
    'utils/simplex'
],function(_, Manager, Filter, simplex){
    function Venn(parent, scales, df_id, _options){
        var options = {
            category: null,
            count: null,
            color:null,
            stroke_color:'#000',
            stroke_width: 1,
            opacity: 0.7,
            hover: false
        };
        if(arguments.length>3)_.extend(options, _options);

        this.getScales = function(data, scales){
            var r_w = _.max(scales.x.range()) - _.min(scales.x.range());
            var r_h = _.max(scales.y.range()) - _.min(scales.y.range());
            var d_x = {
                min: (function(){var min_d = _.min(data.pos, function(d){return d.x - d.r;}); return min_d.x - min_d.r;})(),
                max: (function(){var max_d = _.max(data.pos, function(d){return d.x + d.r;}); return max_d.x + max_d.r;})()
            };
            var d_y = {
                min: (function(){var min_d = _.min(data.pos, function(d){return d.y - d.r;}); return min_d.y - min_d.r;})(),
                max: (function(){var max_d = _.max(data.pos, function(d){return d.y + d.r;}); return max_d.y + max_d.r;})()
            };
            var d_w = d_x.max-d_x.min;
            var d_h = d_y.max-d_y.min;

            var scale = 0;
            if(r_w/r_h > d_w/d_h){
                scale = d_h/r_h;
                var new_d_w = scale*r_w;
                d_x.min -= (new_d_w - d_w)/2;
                d_x.max += (new_d_w - d_w)/2;
            }
            else{
                scale = d_w/r_w;
                var new_d_h = scale*r_h;
                d_h.min -= (new_d_h - d_h)/2;
                d_h.max += (new_d_h - d_h)/2;
            }
            var new_scales = {};
            new_scales.x = d3.scale.linear().range(scales.x.range()).domain([d_x.min, d_x.max]);
            new_scales.y = d3.scale.linear().range(scales.y.range()).domain([d_y.min, d_y.max]);
            new_scales.r = d3.scale.linear().range([0,100]).domain([0,100*scale]);
            return new_scales;
        };

        var df = Manager.getData(df_id);
        var data = this.processData(df.column(options.category), df.column(options.count));
        var new_scales = this.getScales(data, scales);

        var model = parent.append("g");

        var circles = model
                .selectAll("circle")
                .data(data.pos)
                .enter()
                .append("circle");

        var texts = model
                .selectAll("text")
                .data(data.labels)
                .enter()
                .append("text");

        if(options.color == null)this.color_scale = d3.scale.category20();
        else this.color_scale = d3.scale.ordinal().range(options.color);
        var color_scale = this.color_scale;

        this.updateModels(circles, new_scales, options);
        this.updateLabels(texts, new_scales, options);

        var legends = [];
        _.each(data.pos, function(d){
            legends.push({label: d.name, color:color_scale(d.name)});
        });

        this.legends = legends;
        this.scales = scales;
        this.options = options;
        this.model = model;
        this.df = df;
        this.df_id = df_id;

        return this;
    }

    Venn.prototype.processData = function(category_column, count_column){
        var categories = _.uniq(category_column);

        // decide overlapping areas
        var table = (function(){
            var table = [];
            var counted_items = (function(){
                var hash={};
                _.each(_.zip(category_column, count_column), function(arr){
                    if(hash[arr[1]]==undefined)hash[arr[1]]={};
                    hash[arr[1]][arr[0]] = true;
                });
                return _.values(hash);
            })();

            var count_common = function(items){
                var cnt=0;
                _.each(counted_items, function(values, key){
                    if(!_.some(items, function(item){return !(item in values);}))cnt++;
                });
                return cnt;
            };
            
            for(var i = 0; i<categories.length; i++){
                table[i] = [];
                table[i][i] = count_common([categories[i]]);
                for(var j=i+1; j<categories.length; j++){
                    var num = count_common([categories[i], categories[j]]);
                    table[i][j] = num;
                }
            }
            return table;
        })();

        // decide radius of each circle
        var r = _.map(table, function(row, i){
            return Math.sqrt(table[i][i]/(2*Math.PI));
        });

        // function for minimizing loss of overlapping (values: x1,y1,x1,y1...)
        var evaluation = function(values){
            var loss = 0;
            for(var i=0;i<values.length;i+=2){
                for(var j=i+2;j<values.length;j+=2){
                    var x1=values[i], y1=values[i+1], x2=values[j], y2=values[j+1];
                    var r1=r[i/2], r2=r[j/2];
                    var d = Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
                    var S = 0;
                    if(d > r1+r2)S = 0;
                    else{
                        _.each([[r1, r2],[r2, r1]], function(r_arr){
                            var theta = Math.acos((r_arr[1]*r_arr[1] - r_arr[0]*r_arr[0] + d*d)/(2*r_arr[1]*d));
                            var s = r_arr[i]*r_arr[i]*theta - (1/2)*r_arr[1]*r_arr[1]*Math.sin(theta*2);
                            S += s;
                        });
                    }
                    loss += Math.pow(table[i/2][j/2]-S,2);
                }
            }
            return loss;
        };

        // decide initial paramaters
        var init_params = (function(){
            var params = [];
            var set_num = table[0].length;
            var max_area = _.max(table, function(arr, i){
                // calc the sum of overlapping area
                var result=0;
                for(var j=0;j<i;j++)result+=table[j][i];
                for(var j=i+1;j<arr.length;j++)result+=table[i][j];
                return result;
            });
            var center_i = set_num - max_area.length;
            params[center_i*2] = 0; // x
            params[center_i*2+1] = 0; // y
            var rad=0, rad_interval=Math.PI/(1.5*(set_num-1));
            for(var i=0;i<set_num;i++){
                if(i!=center_i){
                    var d = r[center_i] + r[i]/2;
                    params[i*2] = d*Math.sin(rad);
                    params[i*2+1] = d*Math.cos(rad);
                    rad += rad_interval;
                }
            }
            return params;
        })();

        // decide coordinates using Simplex method
        var params = simplex(init_params, evaluation);
        var pos=[], labels=[];
        for(var i=0;i<params.length;i+=2)
            pos.push({x:params[i] ,y:params[i+1], r:r[i/2], name:categories[i/2]});

        for(var i=0;i<categories.length;i++){
            labels.push({x: params[i*2], y: params[i*2+1], val: table[i][i]});
            for(var j=i+1;j<categories.length;j++){
                var x = (params[i*2] + params[j*2])/2;
                var y = (params[i*2+1] + params[j*2+1])/2;
                labels.push({x: x, y: y, val: table[i][j]});
            }
        }

        return {pos:pos, labels:labels};
    };

    Venn.prototype.updateModels = function(selector, scales, options){
        var color_scale = this.color_scale;
        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d3.rgb(color_scale(d.name)).darker(1);});
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return color_scale(d.name);});
        };

        selector
            .attr("cx", function(d){return scales.x(d.x);})
            .attr("cy", function(d){return scales.y(d.y);})
            .attr("stroke", options.stroke_color)
            .attr("stroke-width", options.stroke_width)
            .attr("fill", function(d){return color_scale(d.name);})
            .attr("fill-opacity", options.opacity)
            .transition()
            .duration(500)
            .attr("r", function(d){return scales.r(d.r);});

        if(options.hover)selector
            .on("mouseover", onMouse)
            .on("mouseout", outMouse);
    };

    Venn.prototype.updateLabels = function(selector, scales, options){
        selector
            .attr("x", function(d){return scales.x(d.x);})
            .attr("y", function(d){return scales.y(d.y);})
            .attr("text-anchor", "middle")
            .text(function(d){return String(d.val);});
    };

    Venn.prototype.selected = function(data, row_nums){
        var selected_count = this.df.pickUpCells(this.options.count, row_nums);
        var selected_category = this.df.pickUpCells(this.options.category, row_nums);
        var data = this.processData(selected_category, selected_count, this.options);
        var scales = this.getScales(data, this.scales);

        var circles = this.model.selectAll("circle").data(data.pos);
        var texts = this.model.selectAll("text").data(data.labels);
        this.updateModels(circles, scales, this.options);
        this.updateLabels(texts, scales, this.options);
    };

    Venn.prototype.update = function(){
    };

    Venn.prototype.checkSelectedData = function(ranges){
    };

    return Venn;
});

/*
 * Box: Boxplot
 *
 * This chart is generated from 'value' columns. Box calculates median and other parameters and create box plot using rect and line.
 * Each box is placed in the position on x-axis, corresponds to column name.
 *
 * options:
 *    title        -> String: title of this chart showen on legend
 *    value        -> Array : Array of String (column name)
 *    width        -> Float : 0..1, width of each box
 *    color        -> Array : color in which bars filled.
 *    stroke_color -> String: stroke color
 *    stroke_width -> Float : stroke width
 *    outlier_r    -> Float : radius of outliers
 *    tooltip      -> Object: instance of Tooltip. set by pane.
 *
 * example:
 *    http://bl.ocks.org/domitry/5a89296dfb23f0ea2ffd
 */


define('view/diagrams/box.js',[
    'underscore',
    'node-uuid',
    'core/manager',
    'view/components/filter',
    'view/components/legend/simple_legend'
],function(_, uuid, Manager, SimpleLegend){
    function Box(parent, scales, df_id, _options){
        var options = {
            title: '',
            value: [],
            width: 0.9,
            color:null,
            stroke_color: 'black',
            stroke_width: 1,
            outlier_r: 3,
            tooltip_contents:[],
            tooltip:null
        };
        if(arguments.length>3)_.extend(options, _options);

        var model = parent.append("g");
        var df = Manager.getData(df_id);

        var color_scale;
        if(options.color == null){
            color_scale = d3.scale.category20b();
        }else{
            color_scale = d3.scale.ordinal().range(options.color);
        }

        this.model = model;
        this.scales = scales;
        this.options = options;
        this.df = df;
        this.color_scale = color_scale;
        this.uuid = options.uuid;

        return this;
    }

    // fetch data and update dom object. called by pane which this chart belongs to.
    Box.prototype.update = function(){
        var uuid = this.uuid;
        var processData = this.processData;
        var df = this.df;
        var data = [];
        _.each(this.options.value, function(column_name){
            var column = df.columnWithFilters(uuid, column_name);
            data.push(_.extend(processData(column), {x: column_name}));
        });

        var boxes = this.model.selectAll("g").data(data);
        boxes.enter()
            .append("g");

        this.updateModels(boxes, this.scales, this.options);
    };

    // convert raw data into style information for box
    Box.prototype.processData = function(column){
        var getMed = function(arr){
            var n = arr.length;
            return (n%2==1 ? arr[Math.floor(n/2)] : (arr[n/2]+arr[n/2+1])/2);
        };

        var arr = _.sortBy(column);
        var med = getMed(arr);
        var q1 = getMed(arr.slice(0,arr.length/2-1));
        var q3 = getMed(arr.slice((arr.length%2==0?arr.length/2:arr.length/2+1),arr.length-1));
        var h = q3-q1;
        var max = (_.max(arr)-q3 > 1.5*h ? q3+1.5*h : _.max(arr));
        var min = (q1-_.min(arr) > 1.5*h ? q1-1.5*h : _.min(arr));
        var outlier = _.filter(arr, function(d){return (d>max || d<min);});

        return {
            med:med,
            q1:q1,
            q3:q3,
            max:max,
            min:min,
            outlier:outlier
        };
    };

    // update SVG dom nodes based on data
    Box.prototype.updateModels = function(selector, scales, options){
        var width = scales.raw.x.rangeBand()*options.width;
        var padding = scales.raw.x.rangeBand()*((1-options.width)/2);
        var color_scale = this.color_scale;

        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d3.rgb(color_scale(d.x)).darker(1);});
            var id = d3.select(this).attr("id");

            options.tooltip.addToYAxis(id, this.__data__.min, 3);
            options.tooltip.addToYAxis(id, this.__data__.q1, 3);
            options.tooltip.addToYAxis(id, this.__data__.med, 3);
            options.tooltip.addToYAxis(id, this.__data__.q3, 3);
            options.tooltip.addToYAxis(id, this.__data__.max, 3);
            options.tooltip.update();
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d3.rgb(color_scale(d.x));});
            var id = d3.select(this).attr("id");
            options.tooltip.reset();
        };

        selector
            .append("line")
            .attr("x1", function(d){return scales.get(d.x, 0).x + width/2 + padding;})
            .attr("y1", function(d){return scales.get(d.x, d.max).y;})
            .attr("x2", function(d){return scales.get(d.x, 0).x + width/2 + padding;})
            .attr("y2", function(d){return scales.get(d.x, d.min).y;})
            .attr("stroke", options.stroke_color);

        selector
            .append("rect")
            .attr("x", function(d){return scales.get(d.x, 0).x + padding;})
            .attr("y", function(d){return scales.get(d.x, d.q3).y;})
            .attr("height", function(d){return scales.get(d.x, d.q1).y - scales.get(d.x, d.q3).y;})
            .attr("width", width)
            .attr("fill", function(d){return color_scale(d.x);})
            .attr("stroke", options.stroke_color)
            .attr("id", uuid.v4())
            .on("mouseover", onMouse)
            .on("mouseout", outMouse);

        // median line
        selector
            .append("line")
            .attr("x1", function(d){return scales.get(d.x,0).x + padding;})
            .attr("y1", function(d){return scales.get(d.x, d.med).y;})
            .attr("x2", function(d){return scales.get(d.x, 0).x + width + padding;})
            .attr("y2", function(d){return scales.get(d.x, d.med).y;})
            .attr("stroke", options.stroke_color);

        selector
            .append("g")
            .each(function(d,i){
                d3.select(this)
                    .selectAll("circle")
                    .data(d.outlier)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d1){return scales.get(d.x,0).x + width/2 + padding;})
                    .attr("cy", function(d1){return scales.get(d.x,d1).y;})
                    .attr("r", options.outlier_r);
            });
    };

    // return legend object based on data prepared by initializer
    Box.prototype.getLegend = function(){
        return new SimpleLegend(this.legend_data);
    };

    // answer to callback coming from filter. not implemented yet.
    Box.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Box;
});

/*
 * ColorBar: 
 *
 * ColorBar provides colorbar filled with gradient for continuous data.
 * Each diagram create an instance of Colorset and Pane append it to itself.
 *
 * options:
 *    width -> Float: width of the whole area for colorset (not noly for bar)
 *    height-> Float: height of the area for colorset
 *
 * example:
 *    http://bl.ocks.org/domitry/11322618
 */

define('view/components/legend/color_bar',[
    'underscore'
], function(_){
    function ColorBar(color_scale, _options){
        var options = {
            width: 150,
            height: 200
        };
        if(arguments.length>1)_.extend(options, _options);
        
        this.options = options;
        this.model = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "g"));
        this.color_scale = color_scale;
    }

    ColorBar.prototype.width = function(){
        return this.options.width;
    };

    ColorBar.prototype.height = function(){
        return this.options.height;
    };

    // Create dom object independent form pane or context and return it. called by each diagram.o
    ColorBar.prototype.getDomObject = function(){
        var model = this.model;
	    var color_scale = this.color_scale;
        var colors = color_scale.range();
        var values = color_scale.domain();

        var height_scale = d3.scale.linear()
                .domain(d3.extent(values))
                .range([this.options.height,0]);

	    var gradient = model.append("svg:defs")
	            .append("svg:linearGradient")
	            .attr("id", "gradient")
	            .attr("x1", "0%")
	            .attr("x2", "0%")
	            .attr("y1", "100%")
	            .attr("y2", "0%");

	    for(var i=0; i<colors.length; i++){
	        gradient.append("svg:stop")
		        .attr("offset", (100/(colors.length-1))*i + "%")
		        .attr("stop-color", colors[i]);
	    }

	    var group = model.append("g");

	    group.append("svg:rect")
	        .attr("y",10)
	        .attr("width", "25")
	        .attr("height", this.options.height)
	        .style("fill", "url(#gradient)");

	    model.append("g")
	        .attr("width", "100")
	        .attr("height", this.options.height)
	        .attr("class", "axis")
	        .attr("transform", "translate(25,10)")
	        .call(d3.svg.axis()
		          .scale(height_scale)
		          .orient("right")
		          .ticks(5));

	    model.selectAll(".axis").selectAll("path")
	        .style("fill", "none")
	        .style("stroke", "black")
	        .style("shape-rendering", "crispEdges");

	    model.selectAll(".axis").selectAll("line")
	        .style("fill", "none")
	        .style("stroke", "black")
	        .style("shape-rendering", "crispEdges");

	    model.selectAll(".axis").selectAll("text")
	        .style("font-family", "san-serif")
	        .style("font-size", "11px");

	    return model;
    };

    return ColorBar;
});

define('colorbrewer',[],function(){
return{
"Spectral":  {"3": ["rgb(252,141,89)", "rgb(255,255,191)", "rgb(153,213,148)"], "4": ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(171,221,164)", "rgb(43,131,186)"], "5": ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(255,255,191)", "rgb(171,221,164)", "rgb(43,131,186)"], "6": ["rgb(213,62,79)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(230,245,152)", "rgb(153,213,148)", "rgb(50,136,189)"], "7": ["rgb(213,62,79)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(153,213,148)", "rgb(50,136,189)"], "8": ["rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)"], "9": ["rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)"], "10": ["rgb(158,1,66)", "rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)", "rgb(94,79,162)"], "11": ["rgb(158,1,66)", "rgb(213,62,79)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(230,245,152)", "rgb(171,221,164)", "rgb(102,194,165)", "rgb(50,136,189)", "rgb(94,79,162)"], "type": "div"} ,
"RdYlGn":  {"3": ["rgb(252,141,89)", "rgb(255,255,191)", "rgb(145,207,96)"], "4": ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(166,217,106)", "rgb(26,150,65)"], "5": ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(255,255,191)", "rgb(166,217,106)", "rgb(26,150,65)"], "6": ["rgb(215,48,39)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(217,239,139)", "rgb(145,207,96)", "rgb(26,152,80)"], "7": ["rgb(215,48,39)", "rgb(252,141,89)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(217,239,139)", "rgb(145,207,96)", "rgb(26,152,80)"], "8": ["rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(217,239,139)", "rgb(166,217,106)", "rgb(102,189,99)", "rgb(26,152,80)"], "9": ["rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(217,239,139)", "rgb(166,217,106)", "rgb(102,189,99)", "rgb(26,152,80)"], "10": ["rgb(165,0,38)", "rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(217,239,139)", "rgb(166,217,106)", "rgb(102,189,99)", "rgb(26,152,80)", "rgb(0,104,55)"], "11": ["rgb(165,0,38)", "rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,139)", "rgb(255,255,191)", "rgb(217,239,139)", "rgb(166,217,106)", "rgb(102,189,99)", "rgb(26,152,80)", "rgb(0,104,55)"], "type": "div"} ,
"RdBu":  {"3": ["rgb(239,138,98)", "rgb(247,247,247)", "rgb(103,169,207)"], "4": ["rgb(202,0,32)", "rgb(244,165,130)", "rgb(146,197,222)", "rgb(5,113,176)"], "5": ["rgb(202,0,32)", "rgb(244,165,130)", "rgb(247,247,247)", "rgb(146,197,222)", "rgb(5,113,176)"], "6": ["rgb(178,24,43)", "rgb(239,138,98)", "rgb(253,219,199)", "rgb(209,229,240)", "rgb(103,169,207)", "rgb(33,102,172)"], "7": ["rgb(178,24,43)", "rgb(239,138,98)", "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(103,169,207)", "rgb(33,102,172)"], "8": ["rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)"], "9": ["rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)"], "10": ["rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"], "11": ["rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"], "type": "div"} ,
"PiYG":  {"3": ["rgb(233,163,201)", "rgb(247,247,247)", "rgb(161,215,106)"], "4": ["rgb(208,28,139)", "rgb(241,182,218)", "rgb(184,225,134)", "rgb(77,172,38)"], "5": ["rgb(208,28,139)", "rgb(241,182,218)", "rgb(247,247,247)", "rgb(184,225,134)", "rgb(77,172,38)"], "6": ["rgb(197,27,125)", "rgb(233,163,201)", "rgb(253,224,239)", "rgb(230,245,208)", "rgb(161,215,106)", "rgb(77,146,33)"], "7": ["rgb(197,27,125)", "rgb(233,163,201)", "rgb(253,224,239)", "rgb(247,247,247)", "rgb(230,245,208)", "rgb(161,215,106)", "rgb(77,146,33)"], "8": ["rgb(197,27,125)", "rgb(222,119,174)", "rgb(241,182,218)", "rgb(253,224,239)", "rgb(230,245,208)", "rgb(184,225,134)", "rgb(127,188,65)", "rgb(77,146,33)"], "9": ["rgb(197,27,125)", "rgb(222,119,174)", "rgb(241,182,218)", "rgb(253,224,239)", "rgb(247,247,247)", "rgb(230,245,208)", "rgb(184,225,134)", "rgb(127,188,65)", "rgb(77,146,33)"], "10": ["rgb(142,1,82)", "rgb(197,27,125)", "rgb(222,119,174)", "rgb(241,182,218)", "rgb(253,224,239)", "rgb(230,245,208)", "rgb(184,225,134)", "rgb(127,188,65)", "rgb(77,146,33)", "rgb(39,100,25)"], "11": ["rgb(142,1,82)", "rgb(197,27,125)", "rgb(222,119,174)", "rgb(241,182,218)", "rgb(253,224,239)", "rgb(247,247,247)", "rgb(230,245,208)", "rgb(184,225,134)", "rgb(127,188,65)", "rgb(77,146,33)", "rgb(39,100,25)"], "type": "div"} ,
"PRGn":  {"3": ["rgb(175,141,195)", "rgb(247,247,247)", "rgb(127,191,123)"], "4": ["rgb(123,50,148)", "rgb(194,165,207)", "rgb(166,219,160)", "rgb(0,136,55)"], "5": ["rgb(123,50,148)", "rgb(194,165,207)", "rgb(247,247,247)", "rgb(166,219,160)", "rgb(0,136,55)"], "6": ["rgb(118,42,131)", "rgb(175,141,195)", "rgb(231,212,232)", "rgb(217,240,211)", "rgb(127,191,123)", "rgb(27,120,55)"], "7": ["rgb(118,42,131)", "rgb(175,141,195)", "rgb(231,212,232)", "rgb(247,247,247)", "rgb(217,240,211)", "rgb(127,191,123)", "rgb(27,120,55)"], "8": ["rgb(118,42,131)", "rgb(153,112,171)", "rgb(194,165,207)", "rgb(231,212,232)", "rgb(217,240,211)", "rgb(166,219,160)", "rgb(90,174,97)", "rgb(27,120,55)"], "9": ["rgb(118,42,131)", "rgb(153,112,171)", "rgb(194,165,207)", "rgb(231,212,232)", "rgb(247,247,247)", "rgb(217,240,211)", "rgb(166,219,160)", "rgb(90,174,97)", "rgb(27,120,55)"], "10": ["rgb(64,0,75)", "rgb(118,42,131)", "rgb(153,112,171)", "rgb(194,165,207)", "rgb(231,212,232)", "rgb(217,240,211)", "rgb(166,219,160)", "rgb(90,174,97)", "rgb(27,120,55)", "rgb(0,68,27)"], "11": ["rgb(64,0,75)", "rgb(118,42,131)", "rgb(153,112,171)", "rgb(194,165,207)", "rgb(231,212,232)", "rgb(247,247,247)", "rgb(217,240,211)", "rgb(166,219,160)", "rgb(90,174,97)", "rgb(27,120,55)", "rgb(0,68,27)"], "type": "div"} ,
"RdYlBu":  {"3": ["rgb(252,141,89)", "rgb(255,255,191)", "rgb(145,191,219)"], "4": ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(171,217,233)", "rgb(44,123,182)"], "5": ["rgb(215,25,28)", "rgb(253,174,97)", "rgb(255,255,191)", "rgb(171,217,233)", "rgb(44,123,182)"], "6": ["rgb(215,48,39)", "rgb(252,141,89)", "rgb(254,224,144)", "rgb(224,243,248)", "rgb(145,191,219)", "rgb(69,117,180)"], "7": ["rgb(215,48,39)", "rgb(252,141,89)", "rgb(254,224,144)", "rgb(255,255,191)", "rgb(224,243,248)", "rgb(145,191,219)", "rgb(69,117,180)"], "8": ["rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,144)", "rgb(224,243,248)", "rgb(171,217,233)", "rgb(116,173,209)", "rgb(69,117,180)"], "9": ["rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,144)", "rgb(255,255,191)", "rgb(224,243,248)", "rgb(171,217,233)", "rgb(116,173,209)", "rgb(69,117,180)"], "10": ["rgb(165,0,38)", "rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,144)", "rgb(224,243,248)", "rgb(171,217,233)", "rgb(116,173,209)", "rgb(69,117,180)", "rgb(49,54,149)"], "11": ["rgb(165,0,38)", "rgb(215,48,39)", "rgb(244,109,67)", "rgb(253,174,97)", "rgb(254,224,144)", "rgb(255,255,191)", "rgb(224,243,248)", "rgb(171,217,233)", "rgb(116,173,209)", "rgb(69,117,180)", "rgb(49,54,149)"], "type": "div"} ,
"BrBG":  {"3": ["rgb(216,179,101)", "rgb(245,245,245)", "rgb(90,180,172)"], "4": ["rgb(166,97,26)", "rgb(223,194,125)", "rgb(128,205,193)", "rgb(1,133,113)"], "5": ["rgb(166,97,26)", "rgb(223,194,125)", "rgb(245,245,245)", "rgb(128,205,193)", "rgb(1,133,113)"], "6": ["rgb(140,81,10)", "rgb(216,179,101)", "rgb(246,232,195)", "rgb(199,234,229)", "rgb(90,180,172)", "rgb(1,102,94)"], "7": ["rgb(140,81,10)", "rgb(216,179,101)", "rgb(246,232,195)", "rgb(245,245,245)", "rgb(199,234,229)", "rgb(90,180,172)", "rgb(1,102,94)"], "8": ["rgb(140,81,10)", "rgb(191,129,45)", "rgb(223,194,125)", "rgb(246,232,195)", "rgb(199,234,229)", "rgb(128,205,193)", "rgb(53,151,143)", "rgb(1,102,94)"], "9": ["rgb(140,81,10)", "rgb(191,129,45)", "rgb(223,194,125)", "rgb(246,232,195)", "rgb(245,245,245)", "rgb(199,234,229)", "rgb(128,205,193)", "rgb(53,151,143)", "rgb(1,102,94)"], "10": ["rgb(84,48,5)", "rgb(140,81,10)", "rgb(191,129,45)", "rgb(223,194,125)", "rgb(246,232,195)", "rgb(199,234,229)", "rgb(128,205,193)", "rgb(53,151,143)", "rgb(1,102,94)", "rgb(0,60,48)"], "11": ["rgb(84,48,5)", "rgb(140,81,10)", "rgb(191,129,45)", "rgb(223,194,125)", "rgb(246,232,195)", "rgb(245,245,245)", "rgb(199,234,229)", "rgb(128,205,193)", "rgb(53,151,143)", "rgb(1,102,94)", "rgb(0,60,48)"], "type": "div"} ,
"RdGy":  {"3": ["rgb(239,138,98)", "rgb(255,255,255)", "rgb(153,153,153)"], "4": ["rgb(202,0,32)", "rgb(244,165,130)", "rgb(186,186,186)", "rgb(64,64,64)"], "5": ["rgb(202,0,32)", "rgb(244,165,130)", "rgb(255,255,255)", "rgb(186,186,186)", "rgb(64,64,64)"], "6": ["rgb(178,24,43)", "rgb(239,138,98)", "rgb(253,219,199)", "rgb(224,224,224)", "rgb(153,153,153)", "rgb(77,77,77)"], "7": ["rgb(178,24,43)", "rgb(239,138,98)", "rgb(253,219,199)", "rgb(255,255,255)", "rgb(224,224,224)", "rgb(153,153,153)", "rgb(77,77,77)"], "8": ["rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(224,224,224)", "rgb(186,186,186)", "rgb(135,135,135)", "rgb(77,77,77)"], "9": ["rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(255,255,255)", "rgb(224,224,224)", "rgb(186,186,186)", "rgb(135,135,135)", "rgb(77,77,77)"], "10": ["rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(224,224,224)", "rgb(186,186,186)", "rgb(135,135,135)", "rgb(77,77,77)", "rgb(26,26,26)"], "11": ["rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(255,255,255)", "rgb(224,224,224)", "rgb(186,186,186)", "rgb(135,135,135)", "rgb(77,77,77)", "rgb(26,26,26)"], "type": "div"} ,
"PuOr":  {"3": ["rgb(241,163,64)", "rgb(247,247,247)", "rgb(153,142,195)"], "4": ["rgb(230,97,1)", "rgb(253,184,99)", "rgb(178,171,210)", "rgb(94,60,153)"], "5": ["rgb(230,97,1)", "rgb(253,184,99)", "rgb(247,247,247)", "rgb(178,171,210)", "rgb(94,60,153)"], "6": ["rgb(179,88,6)", "rgb(241,163,64)", "rgb(254,224,182)", "rgb(216,218,235)", "rgb(153,142,195)", "rgb(84,39,136)"], "7": ["rgb(179,88,6)", "rgb(241,163,64)", "rgb(254,224,182)", "rgb(247,247,247)", "rgb(216,218,235)", "rgb(153,142,195)", "rgb(84,39,136)"], "8": ["rgb(179,88,6)", "rgb(224,130,20)", "rgb(253,184,99)", "rgb(254,224,182)", "rgb(216,218,235)", "rgb(178,171,210)", "rgb(128,115,172)", "rgb(84,39,136)"], "9": ["rgb(179,88,6)", "rgb(224,130,20)", "rgb(253,184,99)", "rgb(254,224,182)", "rgb(247,247,247)", "rgb(216,218,235)", "rgb(178,171,210)", "rgb(128,115,172)", "rgb(84,39,136)"], "10": ["rgb(127,59,8)", "rgb(179,88,6)", "rgb(224,130,20)", "rgb(253,184,99)", "rgb(254,224,182)", "rgb(216,218,235)", "rgb(178,171,210)", "rgb(128,115,172)", "rgb(84,39,136)", "rgb(45,0,75)"], "11": ["rgb(127,59,8)", "rgb(179,88,6)", "rgb(224,130,20)", "rgb(253,184,99)", "rgb(254,224,182)", "rgb(247,247,247)", "rgb(216,218,235)", "rgb(178,171,210)", "rgb(128,115,172)", "rgb(84,39,136)", "rgb(45,0,75)"], "type": "div"} ,

"Set2":  {"3": ["rgb(102,194,165)", "rgb(252,141,98)", "rgb(141,160,203)"], "4": ["rgb(102,194,165)", "rgb(252,141,98)", "rgb(141,160,203)", "rgb(231,138,195)"], "5": ["rgb(102,194,165)", "rgb(252,141,98)", "rgb(141,160,203)", "rgb(231,138,195)", "rgb(166,216,84)"], "6": ["rgb(102,194,165)", "rgb(252,141,98)", "rgb(141,160,203)", "rgb(231,138,195)", "rgb(166,216,84)", "rgb(255,217,47)"], "7": ["rgb(102,194,165)", "rgb(252,141,98)", "rgb(141,160,203)", "rgb(231,138,195)", "rgb(166,216,84)", "rgb(255,217,47)", "rgb(229,196,148)"], "8": ["rgb(102,194,165)", "rgb(252,141,98)", "rgb(141,160,203)", "rgb(231,138,195)", "rgb(166,216,84)", "rgb(255,217,47)", "rgb(229,196,148)", "rgb(179,179,179)"], "type": "qual"} ,
"Accent":  {"3": ["rgb(127,201,127)", "rgb(190,174,212)", "rgb(253,192,134)"], "4": ["rgb(127,201,127)", "rgb(190,174,212)", "rgb(253,192,134)", "rgb(255,255,153)"], "5": ["rgb(127,201,127)", "rgb(190,174,212)", "rgb(253,192,134)", "rgb(255,255,153)", "rgb(56,108,176)"], "6": ["rgb(127,201,127)", "rgb(190,174,212)", "rgb(253,192,134)", "rgb(255,255,153)", "rgb(56,108,176)", "rgb(240,2,127)"], "7": ["rgb(127,201,127)", "rgb(190,174,212)", "rgb(253,192,134)", "rgb(255,255,153)", "rgb(56,108,176)", "rgb(240,2,127)", "rgb(191,91,23)"], "8": ["rgb(127,201,127)", "rgb(190,174,212)", "rgb(253,192,134)", "rgb(255,255,153)", "rgb(56,108,176)", "rgb(240,2,127)", "rgb(191,91,23)", "rgb(102,102,102)"], "type": "qual"} ,
"Set1":  {"3": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)"], "4": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)", "rgb(152,78,163)"], "5": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)", "rgb(152,78,163)", "rgb(255,127,0)"], "6": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)", "rgb(152,78,163)", "rgb(255,127,0)", "rgb(255,255,51)"], "7": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)", "rgb(152,78,163)", "rgb(255,127,0)", "rgb(255,255,51)", "rgb(166,86,40)"], "8": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)", "rgb(152,78,163)", "rgb(255,127,0)", "rgb(255,255,51)", "rgb(166,86,40)", "rgb(247,129,191)"], "9": ["rgb(228,26,28)", "rgb(55,126,184)", "rgb(77,175,74)", "rgb(152,78,163)", "rgb(255,127,0)", "rgb(255,255,51)", "rgb(166,86,40)", "rgb(247,129,191)", "rgb(153,153,153)"], "type": "qual"} ,
"Set3":  {"3": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)"], "4": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)"], "5": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)"], "6": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)"], "7": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)", "rgb(179,222,105)"], "8": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)", "rgb(179,222,105)", "rgb(252,205,229)"], "9": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)", "rgb(179,222,105)", "rgb(252,205,229)", "rgb(217,217,217)"], "10": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)", "rgb(179,222,105)", "rgb(252,205,229)", "rgb(217,217,217)", "rgb(188,128,189)"], "11": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)", "rgb(179,222,105)", "rgb(252,205,229)", "rgb(217,217,217)", "rgb(188,128,189)", "rgb(204,235,197)"], "12": ["rgb(141,211,199)", "rgb(255,255,179)", "rgb(190,186,218)", "rgb(251,128,114)", "rgb(128,177,211)", "rgb(253,180,98)", "rgb(179,222,105)", "rgb(252,205,229)", "rgb(217,217,217)", "rgb(188,128,189)", "rgb(204,235,197)", "rgb(255,237,111)"], "type": "qual"} ,
"Dark2":  {"3": ["rgb(27,158,119)", "rgb(217,95,2)", "rgb(117,112,179)"], "4": ["rgb(27,158,119)", "rgb(217,95,2)", "rgb(117,112,179)", "rgb(231,41,138)"], "5": ["rgb(27,158,119)", "rgb(217,95,2)", "rgb(117,112,179)", "rgb(231,41,138)", "rgb(102,166,30)"], "6": ["rgb(27,158,119)", "rgb(217,95,2)", "rgb(117,112,179)", "rgb(231,41,138)", "rgb(102,166,30)", "rgb(230,171,2)"], "7": ["rgb(27,158,119)", "rgb(217,95,2)", "rgb(117,112,179)", "rgb(231,41,138)", "rgb(102,166,30)", "rgb(230,171,2)", "rgb(166,118,29)"], "8": ["rgb(27,158,119)", "rgb(217,95,2)", "rgb(117,112,179)", "rgb(231,41,138)", "rgb(102,166,30)", "rgb(230,171,2)", "rgb(166,118,29)", "rgb(102,102,102)"], "type": "qual"} ,
"Paired":  {"3": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)"], "4": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)"], "5": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)"], "6": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)"], "7": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)", "rgb(253,191,111)"], "8": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)", "rgb(253,191,111)", "rgb(255,127,0)"], "9": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)", "rgb(253,191,111)", "rgb(255,127,0)", "rgb(202,178,214)"], "10": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)", "rgb(253,191,111)", "rgb(255,127,0)", "rgb(202,178,214)", "rgb(106,61,154)"], "11": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)", "rgb(253,191,111)", "rgb(255,127,0)", "rgb(202,178,214)", "rgb(106,61,154)", "rgb(255,255,153)"], "12": ["rgb(166,206,227)", "rgb(31,120,180)", "rgb(178,223,138)", "rgb(51,160,44)", "rgb(251,154,153)", "rgb(227,26,28)", "rgb(253,191,111)", "rgb(255,127,0)", "rgb(202,178,214)", "rgb(106,61,154)", "rgb(255,255,153)", "rgb(177,89,40)"], "type": "qual"} ,
"Pastel2":  {"3": ["rgb(179,226,205)", "rgb(253,205,172)", "rgb(203,213,232)"], "4": ["rgb(179,226,205)", "rgb(253,205,172)", "rgb(203,213,232)", "rgb(244,202,228)"], "5": ["rgb(179,226,205)", "rgb(253,205,172)", "rgb(203,213,232)", "rgb(244,202,228)", "rgb(230,245,201)"], "6": ["rgb(179,226,205)", "rgb(253,205,172)", "rgb(203,213,232)", "rgb(244,202,228)", "rgb(230,245,201)", "rgb(255,242,174)"], "7": ["rgb(179,226,205)", "rgb(253,205,172)", "rgb(203,213,232)", "rgb(244,202,228)", "rgb(230,245,201)", "rgb(255,242,174)", "rgb(241,226,204)"], "8": ["rgb(179,226,205)", "rgb(253,205,172)", "rgb(203,213,232)", "rgb(244,202,228)", "rgb(230,245,201)", "rgb(255,242,174)", "rgb(241,226,204)", "rgb(204,204,204)"], "type": "qual"} ,
"Pastel1":  {"3": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)"], "4": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)", "rgb(222,203,228)"], "5": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)", "rgb(222,203,228)", "rgb(254,217,166)"], "6": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)", "rgb(222,203,228)", "rgb(254,217,166)", "rgb(255,255,204)"], "7": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)", "rgb(222,203,228)", "rgb(254,217,166)", "rgb(255,255,204)", "rgb(229,216,189)"], "8": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)", "rgb(222,203,228)", "rgb(254,217,166)", "rgb(255,255,204)", "rgb(229,216,189)", "rgb(253,218,236)"], "9": ["rgb(251,180,174)", "rgb(179,205,227)", "rgb(204,235,197)", "rgb(222,203,228)", "rgb(254,217,166)", "rgb(255,255,204)", "rgb(229,216,189)", "rgb(253,218,236)", "rgb(242,242,242)"], "type": "qual"} ,

"OrRd":  {"3": ["rgb(254,232,200)", "rgb(253,187,132)", "rgb(227,74,51)"], "4": ["rgb(254,240,217)", "rgb(253,204,138)", "rgb(252,141,89)", "rgb(215,48,31)"], "5": ["rgb(254,240,217)", "rgb(253,204,138)", "rgb(252,141,89)", "rgb(227,74,51)", "rgb(179,0,0)"], "6": ["rgb(254,240,217)", "rgb(253,212,158)", "rgb(253,187,132)", "rgb(252,141,89)", "rgb(227,74,51)", "rgb(179,0,0)"], "7": ["rgb(254,240,217)", "rgb(253,212,158)", "rgb(253,187,132)", "rgb(252,141,89)", "rgb(239,101,72)", "rgb(215,48,31)", "rgb(153,0,0)"], "8": ["rgb(255,247,236)", "rgb(254,232,200)", "rgb(253,212,158)", "rgb(253,187,132)", "rgb(252,141,89)", "rgb(239,101,72)", "rgb(215,48,31)", "rgb(153,0,0)"], "9": ["rgb(255,247,236)", "rgb(254,232,200)", "rgb(253,212,158)", "rgb(253,187,132)", "rgb(252,141,89)", "rgb(239,101,72)", "rgb(215,48,31)", "rgb(179,0,0)", "rgb(127,0,0)"], "type": "seq"} ,
"PuBu":  {"3": ["rgb(236,231,242)", "rgb(166,189,219)", "rgb(43,140,190)"], "4": ["rgb(241,238,246)", "rgb(189,201,225)", "rgb(116,169,207)", "rgb(5,112,176)"], "5": ["rgb(241,238,246)", "rgb(189,201,225)", "rgb(116,169,207)", "rgb(43,140,190)", "rgb(4,90,141)"], "6": ["rgb(241,238,246)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(116,169,207)", "rgb(43,140,190)", "rgb(4,90,141)"], "7": ["rgb(241,238,246)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(116,169,207)", "rgb(54,144,192)", "rgb(5,112,176)", "rgb(3,78,123)"], "8": ["rgb(255,247,251)", "rgb(236,231,242)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(116,169,207)", "rgb(54,144,192)", "rgb(5,112,176)", "rgb(3,78,123)"], "9": ["rgb(255,247,251)", "rgb(236,231,242)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(116,169,207)", "rgb(54,144,192)", "rgb(5,112,176)", "rgb(4,90,141)", "rgb(2,56,88)"], "type": "seq"} ,
"BuPu":  {"3": ["rgb(224,236,244)", "rgb(158,188,218)", "rgb(136,86,167)"], "4": ["rgb(237,248,251)", "rgb(179,205,227)", "rgb(140,150,198)", "rgb(136,65,157)"], "5": ["rgb(237,248,251)", "rgb(179,205,227)", "rgb(140,150,198)", "rgb(136,86,167)", "rgb(129,15,124)"], "6": ["rgb(237,248,251)", "rgb(191,211,230)", "rgb(158,188,218)", "rgb(140,150,198)", "rgb(136,86,167)", "rgb(129,15,124)"], "7": ["rgb(237,248,251)", "rgb(191,211,230)", "rgb(158,188,218)", "rgb(140,150,198)", "rgb(140,107,177)", "rgb(136,65,157)", "rgb(110,1,107)"], "8": ["rgb(247,252,253)", "rgb(224,236,244)", "rgb(191,211,230)", "rgb(158,188,218)", "rgb(140,150,198)", "rgb(140,107,177)", "rgb(136,65,157)", "rgb(110,1,107)"], "9": ["rgb(247,252,253)", "rgb(224,236,244)", "rgb(191,211,230)", "rgb(158,188,218)", "rgb(140,150,198)", "rgb(140,107,177)", "rgb(136,65,157)", "rgb(129,15,124)", "rgb(77,0,75)"], "type": "seq"} ,
"Oranges":  {"3": ["rgb(254,230,206)", "rgb(253,174,107)", "rgb(230,85,13)"], "4": ["rgb(254,237,222)", "rgb(253,190,133)", "rgb(253,141,60)", "rgb(217,71,1)"], "5": ["rgb(254,237,222)", "rgb(253,190,133)", "rgb(253,141,60)", "rgb(230,85,13)", "rgb(166,54,3)"], "6": ["rgb(254,237,222)", "rgb(253,208,162)", "rgb(253,174,107)", "rgb(253,141,60)", "rgb(230,85,13)", "rgb(166,54,3)"], "7": ["rgb(254,237,222)", "rgb(253,208,162)", "rgb(253,174,107)", "rgb(253,141,60)", "rgb(241,105,19)", "rgb(217,72,1)", "rgb(140,45,4)"], "8": ["rgb(255,245,235)", "rgb(254,230,206)", "rgb(253,208,162)", "rgb(253,174,107)", "rgb(253,141,60)", "rgb(241,105,19)", "rgb(217,72,1)", "rgb(140,45,4)"], "9": ["rgb(255,245,235)", "rgb(254,230,206)", "rgb(253,208,162)", "rgb(253,174,107)", "rgb(253,141,60)", "rgb(241,105,19)", "rgb(217,72,1)", "rgb(166,54,3)", "rgb(127,39,4)"], "type": "seq"} ,
"BuGn":  {"3": ["rgb(229,245,249)", "rgb(153,216,201)", "rgb(44,162,95)"], "4": ["rgb(237,248,251)", "rgb(178,226,226)", "rgb(102,194,164)", "rgb(35,139,69)"], "5": ["rgb(237,248,251)", "rgb(178,226,226)", "rgb(102,194,164)", "rgb(44,162,95)", "rgb(0,109,44)"], "6": ["rgb(237,248,251)", "rgb(204,236,230)", "rgb(153,216,201)", "rgb(102,194,164)", "rgb(44,162,95)", "rgb(0,109,44)"], "7": ["rgb(237,248,251)", "rgb(204,236,230)", "rgb(153,216,201)", "rgb(102,194,164)", "rgb(65,174,118)", "rgb(35,139,69)", "rgb(0,88,36)"], "8": ["rgb(247,252,253)", "rgb(229,245,249)", "rgb(204,236,230)", "rgb(153,216,201)", "rgb(102,194,164)", "rgb(65,174,118)", "rgb(35,139,69)", "rgb(0,88,36)"], "9": ["rgb(247,252,253)", "rgb(229,245,249)", "rgb(204,236,230)", "rgb(153,216,201)", "rgb(102,194,164)", "rgb(65,174,118)", "rgb(35,139,69)", "rgb(0,109,44)", "rgb(0,68,27)"], "type": "seq"} ,
"YlOrBr":  {"3": ["rgb(255,247,188)", "rgb(254,196,79)", "rgb(217,95,14)"], "4": ["rgb(255,255,212)", "rgb(254,217,142)", "rgb(254,153,41)", "rgb(204,76,2)"], "5": ["rgb(255,255,212)", "rgb(254,217,142)", "rgb(254,153,41)", "rgb(217,95,14)", "rgb(153,52,4)"], "6": ["rgb(255,255,212)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(217,95,14)", "rgb(153,52,4)"], "7": ["rgb(255,255,212)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(236,112,20)", "rgb(204,76,2)", "rgb(140,45,4)"], "8": ["rgb(255,255,229)", "rgb(255,247,188)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(236,112,20)", "rgb(204,76,2)", "rgb(140,45,4)"], "9": ["rgb(255,255,229)", "rgb(255,247,188)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(236,112,20)", "rgb(204,76,2)", "rgb(153,52,4)", "rgb(102,37,6)"], "type": "seq"} ,
"YlGn":  {"3": ["rgb(247,252,185)", "rgb(173,221,142)", "rgb(49,163,84)"], "4": ["rgb(255,255,204)", "rgb(194,230,153)", "rgb(120,198,121)", "rgb(35,132,67)"], "5": ["rgb(255,255,204)", "rgb(194,230,153)", "rgb(120,198,121)", "rgb(49,163,84)", "rgb(0,104,55)"], "6": ["rgb(255,255,204)", "rgb(217,240,163)", "rgb(173,221,142)", "rgb(120,198,121)", "rgb(49,163,84)", "rgb(0,104,55)"], "7": ["rgb(255,255,204)", "rgb(217,240,163)", "rgb(173,221,142)", "rgb(120,198,121)", "rgb(65,171,93)", "rgb(35,132,67)", "rgb(0,90,50)"], "8": ["rgb(255,255,229)", "rgb(247,252,185)", "rgb(217,240,163)", "rgb(173,221,142)", "rgb(120,198,121)", "rgb(65,171,93)", "rgb(35,132,67)", "rgb(0,90,50)"], "9": ["rgb(255,255,229)", "rgb(247,252,185)", "rgb(217,240,163)", "rgb(173,221,142)", "rgb(120,198,121)", "rgb(65,171,93)", "rgb(35,132,67)", "rgb(0,104,55)", "rgb(0,69,41)"], "type": "seq"} ,
"Reds":  {"3": ["rgb(254,224,210)", "rgb(252,146,114)", "rgb(222,45,38)"], "4": ["rgb(254,229,217)", "rgb(252,174,145)", "rgb(251,106,74)", "rgb(203,24,29)"], "5": ["rgb(254,229,217)", "rgb(252,174,145)", "rgb(251,106,74)", "rgb(222,45,38)", "rgb(165,15,21)"], "6": ["rgb(254,229,217)", "rgb(252,187,161)", "rgb(252,146,114)", "rgb(251,106,74)", "rgb(222,45,38)", "rgb(165,15,21)"], "7": ["rgb(254,229,217)", "rgb(252,187,161)", "rgb(252,146,114)", "rgb(251,106,74)", "rgb(239,59,44)", "rgb(203,24,29)", "rgb(153,0,13)"], "8": ["rgb(255,245,240)", "rgb(254,224,210)", "rgb(252,187,161)", "rgb(252,146,114)", "rgb(251,106,74)", "rgb(239,59,44)", "rgb(203,24,29)", "rgb(153,0,13)"], "9": ["rgb(255,245,240)", "rgb(254,224,210)", "rgb(252,187,161)", "rgb(252,146,114)", "rgb(251,106,74)", "rgb(239,59,44)", "rgb(203,24,29)", "rgb(165,15,21)", "rgb(103,0,13)"], "type": "seq"} ,
"RdPu":  {"3": ["rgb(253,224,221)", "rgb(250,159,181)", "rgb(197,27,138)"], "4": ["rgb(254,235,226)", "rgb(251,180,185)", "rgb(247,104,161)", "rgb(174,1,126)"], "5": ["rgb(254,235,226)", "rgb(251,180,185)", "rgb(247,104,161)", "rgb(197,27,138)", "rgb(122,1,119)"], "6": ["rgb(254,235,226)", "rgb(252,197,192)", "rgb(250,159,181)", "rgb(247,104,161)", "rgb(197,27,138)", "rgb(122,1,119)"], "7": ["rgb(254,235,226)", "rgb(252,197,192)", "rgb(250,159,181)", "rgb(247,104,161)", "rgb(221,52,151)", "rgb(174,1,126)", "rgb(122,1,119)"], "8": ["rgb(255,247,243)", "rgb(253,224,221)", "rgb(252,197,192)", "rgb(250,159,181)", "rgb(247,104,161)", "rgb(221,52,151)", "rgb(174,1,126)", "rgb(122,1,119)"], "9": ["rgb(255,247,243)", "rgb(253,224,221)", "rgb(252,197,192)", "rgb(250,159,181)", "rgb(247,104,161)", "rgb(221,52,151)", "rgb(174,1,126)", "rgb(122,1,119)", "rgb(73,0,106)"], "type": "seq"} ,
"Greens":  {"3": ["rgb(229,245,224)", "rgb(161,217,155)", "rgb(49,163,84)"], "4": ["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(35,139,69)"], "5": ["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"], "6": ["rgb(237,248,233)", "rgb(199,233,192)", "rgb(161,217,155)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"], "7": ["rgb(237,248,233)", "rgb(199,233,192)", "rgb(161,217,155)", "rgb(116,196,118)", "rgb(65,171,93)", "rgb(35,139,69)", "rgb(0,90,50)"], "8": ["rgb(247,252,245)", "rgb(229,245,224)", "rgb(199,233,192)", "rgb(161,217,155)", "rgb(116,196,118)", "rgb(65,171,93)", "rgb(35,139,69)", "rgb(0,90,50)"], "9": ["rgb(247,252,245)", "rgb(229,245,224)", "rgb(199,233,192)", "rgb(161,217,155)", "rgb(116,196,118)", "rgb(65,171,93)", "rgb(35,139,69)", "rgb(0,109,44)", "rgb(0,68,27)"], "type": "seq"} ,
"YlGnBu":  {"3": ["rgb(237,248,177)", "rgb(127,205,187)", "rgb(44,127,184)"], "4": ["rgb(255,255,204)", "rgb(161,218,180)", "rgb(65,182,196)", "rgb(34,94,168)"], "5": ["rgb(255,255,204)", "rgb(161,218,180)", "rgb(65,182,196)", "rgb(44,127,184)", "rgb(37,52,148)"], "6": ["rgb(255,255,204)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(44,127,184)", "rgb(37,52,148)"], "7": ["rgb(255,255,204)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(29,145,192)", "rgb(34,94,168)", "rgb(12,44,132)"], "8": ["rgb(255,255,217)", "rgb(237,248,177)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(29,145,192)", "rgb(34,94,168)", "rgb(12,44,132)"], "9": ["rgb(255,255,217)", "rgb(237,248,177)", "rgb(199,233,180)", "rgb(127,205,187)", "rgb(65,182,196)", "rgb(29,145,192)", "rgb(34,94,168)", "rgb(37,52,148)", "rgb(8,29,88)"], "type": "seq"} ,
"Purples":  {"3": ["rgb(239,237,245)", "rgb(188,189,220)", "rgb(117,107,177)"], "4": ["rgb(242,240,247)", "rgb(203,201,226)", "rgb(158,154,200)", "rgb(106,81,163)"], "5": ["rgb(242,240,247)", "rgb(203,201,226)", "rgb(158,154,200)", "rgb(117,107,177)", "rgb(84,39,143)"], "6": ["rgb(242,240,247)", "rgb(218,218,235)", "rgb(188,189,220)", "rgb(158,154,200)", "rgb(117,107,177)", "rgb(84,39,143)"], "7": ["rgb(242,240,247)", "rgb(218,218,235)", "rgb(188,189,220)", "rgb(158,154,200)", "rgb(128,125,186)", "rgb(106,81,163)", "rgb(74,20,134)"], "8": ["rgb(252,251,253)", "rgb(239,237,245)", "rgb(218,218,235)", "rgb(188,189,220)", "rgb(158,154,200)", "rgb(128,125,186)", "rgb(106,81,163)", "rgb(74,20,134)"], "9": ["rgb(252,251,253)", "rgb(239,237,245)", "rgb(218,218,235)", "rgb(188,189,220)", "rgb(158,154,200)", "rgb(128,125,186)", "rgb(106,81,163)", "rgb(84,39,143)", "rgb(63,0,125)"], "type": "seq"} ,
"GnBu":  {"3": ["rgb(224,243,219)", "rgb(168,221,181)", "rgb(67,162,202)"], "4": ["rgb(240,249,232)", "rgb(186,228,188)", "rgb(123,204,196)", "rgb(43,140,190)"], "5": ["rgb(240,249,232)", "rgb(186,228,188)", "rgb(123,204,196)", "rgb(67,162,202)", "rgb(8,104,172)"], "6": ["rgb(240,249,232)", "rgb(204,235,197)", "rgb(168,221,181)", "rgb(123,204,196)", "rgb(67,162,202)", "rgb(8,104,172)"], "7": ["rgb(240,249,232)", "rgb(204,235,197)", "rgb(168,221,181)", "rgb(123,204,196)", "rgb(78,179,211)", "rgb(43,140,190)", "rgb(8,88,158)"], "8": ["rgb(247,252,240)", "rgb(224,243,219)", "rgb(204,235,197)", "rgb(168,221,181)", "rgb(123,204,196)", "rgb(78,179,211)", "rgb(43,140,190)", "rgb(8,88,158)"], "9": ["rgb(247,252,240)", "rgb(224,243,219)", "rgb(204,235,197)", "rgb(168,221,181)", "rgb(123,204,196)", "rgb(78,179,211)", "rgb(43,140,190)", "rgb(8,104,172)", "rgb(8,64,129)"], "type": "seq"} ,
"Greys":  {"3": ["rgb(240,240,240)", "rgb(189,189,189)", "rgb(99,99,99)"], "4": ["rgb(247,247,247)", "rgb(204,204,204)", "rgb(150,150,150)", "rgb(82,82,82)"], "5": ["rgb(247,247,247)", "rgb(204,204,204)", "rgb(150,150,150)", "rgb(99,99,99)", "rgb(37,37,37)"], "6": ["rgb(247,247,247)", "rgb(217,217,217)", "rgb(189,189,189)", "rgb(150,150,150)", "rgb(99,99,99)", "rgb(37,37,37)"], "7": ["rgb(247,247,247)", "rgb(217,217,217)", "rgb(189,189,189)", "rgb(150,150,150)", "rgb(115,115,115)", "rgb(82,82,82)", "rgb(37,37,37)"], "8": ["rgb(255,255,255)", "rgb(240,240,240)", "rgb(217,217,217)", "rgb(189,189,189)", "rgb(150,150,150)", "rgb(115,115,115)", "rgb(82,82,82)", "rgb(37,37,37)"], "9": ["rgb(255,255,255)", "rgb(240,240,240)", "rgb(217,217,217)", "rgb(189,189,189)", "rgb(150,150,150)", "rgb(115,115,115)", "rgb(82,82,82)", "rgb(37,37,37)", "rgb(0,0,0)"], "type": "seq"} ,
"YlOrRd":  {"3": ["rgb(255,237,160)", "rgb(254,178,76)", "rgb(240,59,32)"], "4": ["rgb(255,255,178)", "rgb(254,204,92)", "rgb(253,141,60)", "rgb(227,26,28)"], "5": ["rgb(255,255,178)", "rgb(254,204,92)", "rgb(253,141,60)", "rgb(240,59,32)", "rgb(189,0,38)"], "6": ["rgb(255,255,178)", "rgb(254,217,118)", "rgb(254,178,76)", "rgb(253,141,60)", "rgb(240,59,32)", "rgb(189,0,38)"], "7": ["rgb(255,255,178)", "rgb(254,217,118)", "rgb(254,178,76)", "rgb(253,141,60)", "rgb(252,78,42)", "rgb(227,26,28)", "rgb(177,0,38)"], "8": ["rgb(255,255,204)", "rgb(255,237,160)", "rgb(254,217,118)", "rgb(254,178,76)", "rgb(253,141,60)", "rgb(252,78,42)", "rgb(227,26,28)", "rgb(177,0,38)"], "type": "seq"} ,
"PuRd":  {"3": ["rgb(231,225,239)", "rgb(201,148,199)", "rgb(221,28,119)"], "4": ["rgb(241,238,246)", "rgb(215,181,216)", "rgb(223,101,176)", "rgb(206,18,86)"], "5": ["rgb(241,238,246)", "rgb(215,181,216)", "rgb(223,101,176)", "rgb(221,28,119)", "rgb(152,0,67)"], "6": ["rgb(241,238,246)", "rgb(212,185,218)", "rgb(201,148,199)", "rgb(223,101,176)", "rgb(221,28,119)", "rgb(152,0,67)"], "7": ["rgb(241,238,246)", "rgb(212,185,218)", "rgb(201,148,199)", "rgb(223,101,176)", "rgb(231,41,138)", "rgb(206,18,86)", "rgb(145,0,63)"], "8": ["rgb(247,244,249)", "rgb(231,225,239)", "rgb(212,185,218)", "rgb(201,148,199)", "rgb(223,101,176)", "rgb(231,41,138)", "rgb(206,18,86)", "rgb(145,0,63)"], "9": ["rgb(247,244,249)", "rgb(231,225,239)", "rgb(212,185,218)", "rgb(201,148,199)", "rgb(223,101,176)", "rgb(231,41,138)", "rgb(206,18,86)", "rgb(152,0,67)", "rgb(103,0,31)"], "type": "seq"} ,
"Blues":  {"3": ["rgb(222,235,247)", "rgb(158,202,225)", "rgb(49,130,189)"], "4": ["rgb(239,243,255)", "rgb(189,215,231)", "rgb(107,174,214)", "rgb(33,113,181)"], "5": ["rgb(239,243,255)", "rgb(189,215,231)", "rgb(107,174,214)", "rgb(49,130,189)", "rgb(8,81,156)"], "6": ["rgb(239,243,255)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(49,130,189)", "rgb(8,81,156)"], "7": ["rgb(239,243,255)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,69,148)"], "8": ["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,69,148)"], "9": ["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(8,48,107)"], "type": "seq"} ,
"PuBuGn":  {"3": ["rgb(236,226,240)", "rgb(166,189,219)", "rgb(28,144,153)"], "4": ["rgb(246,239,247)", "rgb(189,201,225)", "rgb(103,169,207)", "rgb(2,129,138)"], "5": ["rgb(246,239,247)", "rgb(189,201,225)", "rgb(103,169,207)", "rgb(28,144,153)", "rgb(1,108,89)"], "6": ["rgb(246,239,247)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(103,169,207)", "rgb(28,144,153)", "rgb(1,108,89)"], "7": ["rgb(246,239,247)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(103,169,207)", "rgb(54,144,192)", "rgb(2,129,138)", "rgb(1,100,80)"], "8": ["rgb(255,247,251)", "rgb(236,226,240)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(103,169,207)", "rgb(54,144,192)", "rgb(2,129,138)", "rgb(1,100,80)"], "9": ["rgb(255,247,251)", "rgb(236,226,240)", "rgb(208,209,230)", "rgb(166,189,219)", "rgb(103,169,207)", "rgb(54,144,192)", "rgb(2,129,138)", "rgb(1,108,89)", "rgb(1,70,54)"], "type": "seq"} 
}
});

/*
 * Colorset: The wrapper for colorbrewer
 *
 * Return colorset that have required name and number.
 * See the website of colorbrewer to learn more: http://colorbrewer2.org/
 */

define('utils/color',[
    'underscore',
    'colorbrewer'
],function(_, colorbrewer){
    function colorset(name, num){
        if(arguments.length>1)return colorbrewer[name][num];
        var nums = _.map(_.keys(colorbrewer[name]), function(key){
            return (_.isFinite(key) ? Number(key) : 0);
        });
        var max_num = _.max(nums);
        return colorbrewer[name][String(max_num)];
    }

    return colorset;
});

/*
 * Heatmap: Heatmap or 2D Histogram
 *
 * Heatmap creates rectangles from continuous data. Width and height values should be specified.
 *
 * options:
 *    title        -> String: title of this chart showen on legend
 *    x, y         -> String: column name. Both x and y should be continuous.
 *    width, height-> Float : 0..1, width and height of each rectangle
 *    color        -> Array : color in which bars filled.
 *    stroke_color -> String: stroke color
 *    stroke_width -> Float : stroke width
 *    hover        -> Bool  : set whether pop-up tool-tips when bars are hovered.
 *    tooltip      -> Object: instance of Tooltip. set by pane.
 *
 * example:
 *    http://bl.ocks.org/domitry/eab8723ccb32fd3a6cd8
 */

define('view/diagrams/heatmap.js',[
    'underscore',
    'node-uuid',
    'core/manager',
    'view/components/filter',
    'view/components/legend/color_bar',
    'utils/color'
],function(_, uuid, Manager, Filter, ColorBar, colorset){
    function HeatMap(parent, scales, df_id, _options){
        var options = {
            title: 'heatmap',
            x: null,
            y: null,
            fill: null,
            width: 1.0,
            height: 1.0,
            color: colorset("RdBu").reverse(),
            stroke_color: "#fff",
            stroke_width: 1,
            hover: true,
            tooltip: null
        };
        if(arguments.length>3)_.extend(options, _options);

        var df = Manager.getData(df_id);
        var model = parent.append("g");

        this.color_scale = (function(){
            var column_fill = df.columnWithFilters(options.uuid, options.fill);
            var min_max = d3.extent(column_fill);
            var domain = d3.range(min_max[0], min_max[1], (min_max[1]-min_max[0])/(options.color.length));
            return d3.scale.linear()
                .range(options.color)
                .domain(domain);
        })();

        this.scales = scales;
        this.options = options;
        this.model = model;
        this.df = df;
        this.uuid = options.uuid;
        return this;
    };

    // fetch data and update dom object. called by pane which this chart belongs to.
    HeatMap.prototype.update = function(){
        var data = this.processData();
        var models = this.model.selectAll("rect").data(data);
        models.each(function(){
            var event = document.createEvent("MouseEvents");
            event.initEvent("mouseout", false, true);
            this.dispatchEvent(event);
        });
        models.enter().append("rect");
        this.updateModels(models, this.options);
    };

    // pre-process data. convert data coorinates to dom coordinates with Scale.
    HeatMap.prototype.processData = function(){
        var column_x = this.df.columnWithFilters(this.uuid, this.options.x);
        var column_y = this.df.columnWithFilters(this.uuid, this.options.y);
        var column_fill = this.df.columnWithFilters(this.uuid, this.options.fill);
        var scales = this.scales;
        var options = this.options;
        var color_scale = this.color_scale;

        return _.map(_.zip(column_x, column_y, column_fill), function(row){
            var x, y, width, height;
            width = Math.abs(scales.get(options.width, 0).x - scales.get(0, 0).x);
            height = Math.abs(scales.get(0, options.height).y - scales.get(0, 0).y);
            x = scales.get(row[0], 0).x - width/2;
            y = scales.get(0, row[1]).y - height/2;
            return {x: x, y:y, width:width, height:height, fill:color_scale(row[2]), x_raw: row[0], y_raw: row[1]};
        });
    };

    // update SVG dom nodes based on pre-processed data.
    HeatMap.prototype.updateModels = function(selector, options){
        var id = this.uuid;
        var onMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d3.rgb(d.fill).darker(1);});
            options.tooltip.addToXAxis(id, this.__data__.x_raw, 3);
            options.tooltip.addToYAxis(id, this.__data__.y_raw, 3);
            options.tooltip.update();
        };

        var outMouse = function(){
            d3.select(this).transition()
                .duration(200)
                .attr("fill", function(d){return d.fill;});
            options.tooltip.reset();
        };

        selector
            .attr("x", function(d){return d.x;})
            .attr("width", function(d){return d.width;})
            .attr("y", function(d){return d.y;})
            .attr("height", function(d){return d.height;})
            .attr("fill", function(d){return d.fill;})
            .attr("stroke", options.stroke_color)
            .attr("stroke-width", options.stroke_width);

        if(options.hover)selector
            .on("mouseover", onMouse)
            .on("mouseout", outMouse);
    };

    // return legend object.
    HeatMap.prototype.getLegend = function(){
        return new ColorBar(this.color_scale);
    };    

    // answer to callback coming from filter. not implemented yet.
    HeatMap.prototype.checkSelectedData = function(ranges){
        return;
    };

    return HeatMap;
});

/*
 * Vectors: Vector Field
 *
 * Draw vector field from x, y, dx, dy column. This chart is designed to visualize wind vector data.
 * See Nyaplot's notebook: http://nbviewer.ipython.org/github/domitry/nyaplot/blob/master/examples/notebook/Mapnya2.ipynb
 *
 *
 * options:
 *    x,y,dx,dy    -> String: column name.
 *    fill_by      -> String: column name. Fill vectors according to this column. (both of continuous and descrete data are allowed.)
 *    color        -> Array : color in which vectors are filled.
 *    stroke_color -> String: stroke color.
 *    stroke_width -> Float : stroke width.
 *    hover        -> Bool  : set whether pop-up tool-tips when bars are hovered.
 *    tooltip      -> Object: instance of Tooltip. set by pane.
 *
 * example:
 *    http://bl.ocks.org/domitry/1e1222cbc48ab3880849
 */

define('view/diagrams/vectors.js',[
    'underscore',
    'node-uuid',
    'core/manager',
    'view/components/filter',
    'view/components/legend/simple_legend'
],function(_, uuid, Manager, Filter, SimpleLegend){
    function Vectors(parent, scales, df_id, _options){
        var options = {
            title: 'vectors',
            x: null,
            y: null,
            dx: null,
            dy: null,
            fill_by: null,
            color:['steelblue', '#000000'],
            stroke_color: '#000',
            stroke_width: 2,
            hover: true,
            tooltip:null
        };
        if(arguments.length>3)_.extend(options, _options);

        this.scales = scales;
        var df = Manager.getData(df_id);
        var model = parent.append("g");

        this.legend_data = (function(thisObj){
            var on = function(){
                thisObj.render = true;
                thisObj.update();
            };

            var off = function(){
                thisObj.render = false;
                thisObj.update();
            };
            return [{label: options.title, color:options.color, on:on, off:off}];
        })(this);

        this.render = true;
        this.options = options;
        this.model = model;
        this.df = df;
        this.uuid = options.uuid;

        return this;
    }

    // fetch data and update dom object. called by pane which this chart belongs to.
    Vectors.prototype.update = function(){
        var data = this.processData(this.options);
        this.options.tooltip.reset();
        if(this.render){
            var shapes = this.model.selectAll("line").data(data);
            shapes.enter().append("line");
            this.updateModels(shapes, this.scales, this.options);
        }else{
            this.model.selectAll("line").remove();
        }
    };

    // pre-process data like: [{x: 1, y: 2, dx: 0.1, dy: 0.2, fill:'#000'}, {},...,{}]
    Vectors.prototype.processData = function(options){
        var df = this.df;
        var labels = ['x', 'y', 'dx', 'dy', 'fill'];
        var columns = _.map(['x', 'y', 'dx', 'dy'], function(label){return df.column(options[label]);});
        var length = columns[0].length;

        _.each([{column: 'fill_by', val: 'color'}], function(info){
            if(options[info.column]){
                var scale = df.scale(options[info.column], options[info.val]);
                columns.push(_.map(df.column(options[info.column]), function(val){return scale(val);}));
            }else{
                columns.push(_.map(_.range(1, length+1, 1), function(d){
                    if(_.isArray(options[info.val]))return options[info.val][0];
                    else return options[info.val];
                }));
            }
        });

        return _.map(_.zip.apply(null, columns), function(d){
            return _.reduce(d, function(memo, val, i){memo[labels[i]] = val; return memo;}, {});
        });
    };

    // update SVG dom nodes based on pre-processed data.
    Vectors.prototype.updateModels = function(selector, scales, options){
        selector
            .attr({
                'x1':function(d){return scales.get(d.x, d.y).x;},
                'x2':function(d){return scales.get(d.x + d.dx, d.y + d.dy).x;},
                'y1':function(d){return scales.get(d.x, d.y).y;},
                'y2':function(d){return scales.get(d.x + d.dx, d.y + d.dy).y;},
                'stroke':function(d){return d.fill;},
                'stroke-width':options.stroke_width
            });
    };

    // return legend object.
    Vectors.prototype.getLegend = function(){
        return new SimpleLegend(this.legend_data);
    };

    // answer to callback coming from filter.
    Vectors.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Vectors;
});

/*
 * Diagrams: Diagrams Factory
 *
 * Diagrams manages all diagrams bundled by Nyaplotjs. Extension registers their own diagrams through this module.
 *
 */

define('view/diagrams/diagrams',['require','exports','module','view/diagrams/bar','view/diagrams/histogram','view/diagrams/scatter','view/diagrams/line','view/diagrams/venn','view/diagrams/multiple_venn','view/diagrams/box.js','view/diagrams/heatmap.js','view/diagrams/vectors.js'],function(require, exports, module){
    var diagrams = {};

    diagrams.bar = require('view/diagrams/bar');
    diagrams.histogram = require('view/diagrams/histogram');
    diagrams.scatter = require('view/diagrams/scatter');
    diagrams.line = require('view/diagrams/line');
    diagrams.venn = require('view/diagrams/venn');
    diagrams.multiple_venn = require('view/diagrams/multiple_venn');
    diagrams.box = require('view/diagrams/box.js');
    diagrams.heatmap = require('view/diagrams/heatmap.js');
    diagrams.vectors = require('view/diagrams/vectors.js');

    // Add diagrams. Called by other extensions
    diagrams.add = function(name, diagram){
        diagrams[name] = diagram;
    };

    return diagrams;
});

/*
 * LegendArea: Space for legends
 *
 * LegendArea keep a dom object which legends will be placed on and add legends on the best place in it.
 *
 * options (summary):
 *    width -> Float : width of legend area
 *    height-> Float : height of legend area
 *    margin-> Object: margin inside of legend area
 *
 * example:
 *    http://bl.ocks.org/domitry/e9a914b78f3a576ed3bb
 */

define('view/components/legend_area',[
    'underscore',
    'core/manager'
],function(_, Manager){
    function LegendArea(parent, _options){
        var options = {
            width: 200,
            height: 300,
            margin: {top: 10, bottom:10, left:10, right:10},
            fill_color: 'none',
            stroke_color: '#000',
            stroke_width: 0
        };
        if(arguments.length>1)_.extend(options, _options);

        var model = parent.append("g");

        model.append("rect")
            .attr("width", options.width)
            .attr("height", options.height)
            .attr("x", 0)
            .attr("y", 0)
            .attr("fill", options.fill_color)
            .attr("stroke", options.stroke_color)
            .attr("stroke-width", options.stroke_width);

        this.model = model;
        this.options = options;
        this.seek = {x: options.margin.left, y:options.margin.top, width:0};

        return this;
    }
    
    // Add a new legend to this area
    LegendArea.prototype.add = function(legend){
        var legend_area = this.model.append("g")
                .attr("transform", "translate(" + this.seek.x + "," + this.seek.y + ")");
        var dom = legend.getDomObject();
        legend_area[0][0].appendChild(dom[0][0]);

        // calculate coordinates to place the new legend (too simple algorism!)
        if(this.seek.y + legend.height() > this.options.height){
            this.seek.x += this.seek.width;
            this.seek.y=this.options.margin.top;
        }else{
            this.seek.width = _.max([this.seek.width, legend.width()]);
            this.seek.y += legend.height();
        }
    };

    return LegendArea;
});

/* 
 * Return UA information
 */

define('utils/ua_info',['underscore'], function(_){
    return (function(){
        var userAgent = window.navigator.userAgent.toLowerCase();
        if(userAgent.indexOf('chrome')!=-1)return 'chrome';
        if(userAgent.indexOf('firefox')!=-1)return 'firefox';
        else return 'unknown';
    });
});

/*
 * Tooltip:
 *
 * Tooltip is an module to generate small tool-tips and rendering them.
 * Pane generate its instance and keep it. Then each diagrams send requests to it.
 *
 * options (summary):
 *    arrow_width   -> Float : Width of arrow. See diagram below.
 *    arrow_height  -> Float : Height of arrow.
 *    tooltip_margin-> Object: Margin inside of tool-tip box.
 *
 *    ------
 *    |_  _ |
 *      \/     <=== arrow
 *
 * example: 
 *    http://bl.ocks.org/domitry/78e2a3300f2f27e18cc8
 */

define('view/components/tooltip',[
    'underscore',
    'utils/ua_info'
],function(_, ua){
    function Tooltip(parent, scales, _options){
        var options = {
            bg_color:"#333",
            stroke_color:"#000",
            stroke_width:1,
            text_color:"#fff",
            context_width:0,
            context_height:0,
            context_margin:{top:0,left:0,bottom:0,right:0},
            arrow_width:10,
            arrow_height:10,
            tooltip_margin:{top:2,left:5,bottom:2,right:5},
            font: "Helvetica, Arial, sans-serif",
            font_size: "1em"
        };
        if(arguments.length>1)_.extend(options, _options);
        
        var model=parent.append("g");

        this.scales = scales;
        this.options = options;
        this.lists = [];
        this.model = model;

        return this;
    }

    // add small tool-tip to context area
    Tooltip.prototype.add = function(id, x, y, pos, contents){
        var str = _.map(contents, function(v, k){
            return String(k) + ":" + String(v);
        });
        this.lists.push({id:id, x:x, y:y, pos:pos, contents:str});
    };

    // add small tool-tip to x-axis
    Tooltip.prototype.addToXAxis = function(id, x, round){
        if(arguments.length > 2){
            var pow10 = Math.pow(10, round);
            x = Math.round(x*pow10)/pow10;
        }
        this.lists.push({id:id, x:x, y:"bottom", pos:'bottom', contents:String(x)});
    };

    // add small tool-tip to y-axis
    Tooltip.prototype.addToYAxis = function(id, y, round){
        if(arguments.length > 2){
            var pow10 = Math.pow(10, round);
            y = Math.round(y*pow10)/pow10;
        }
        this.lists.push({id:id, x:"left", y:y, pos:'right', contents:String(y)});
    };

    // remove all exsistng tool-tips
    Tooltip.prototype.reset = function(){
        this.lists = [];
        this.update();
    };

    // calcurate position, height and width of tool-tip, then update dom objects
    Tooltip.prototype.update = function(){
        var style = this.processData(this.lists);
        var model = this.model.selectAll("g").data(style);
        this.updateModels(model);
    };

    // generate dom objects for new tool-tips, and delete old ones
    Tooltip.prototype.updateModels = function(model){
        model.exit().remove();
        var options = this.options;

        (function(enters, options){
            var lineFunc = d3.svg.line()
                    .x(function(d){return d.x;})
                    .y(function(d){return d.y;})
                    .interpolate("linear");

            enters.append("path")
                .attr("d", function(d){return lineFunc(d.shape);})
                .attr("stroke", options.stroke_color)
                .attr("fill", options.bg_color);
            //.atrr("stroke-width", options.stroke_width)

            enters.each(function(){
                var dom;
                if(_.isArray(this.__data__.text)){
                    var texts = this.__data__.text;
                    var x = this.__data__.text_x;
                    var y = this.__data__.text_y;
                    var data = _.map(_.zip(texts, y), function(row){return {text: row[0], y: row[1]};});
                    dom = d3.select(this)
                        .append("g")
                        .selectAll("text")
                        .data(data)
                        .enter()
                        .append("text")
                        .text(function(d){return d.text;})
                        .attr("x", function(d){return x;})
                        .attr("y", function(d){return d.y;});
                }else{
                    dom = d3.select(this).append("text")
                        .text(function(d){return d.text;})
                        .attr("x", function(d){return d.text_x;})
                        .attr("y", function(d){return d.text_y;});
                }
                dom.attr("text-anchor", "middle")
                    .attr("fill", "#ffffff")
                    .attr("font-size",options.font_size)
                    .style("font-family", options.font);

                // Fix for chrome's Issue 143990
                // https://code.google.com/p/chromium/issues/detail?colspec=ID20Pri20Feature20Status20Modified20Mstone%20OS&sort=-modified&id=143990
                switch(ua()){
                    case 'chrome':
                    dom.attr("dominant-baseline","middle").attr("baseline-shift","50%");break;
                    default:
                    dom.attr("dominant-baseline","text-after-edge");break;
                }
            });

            enters.attr("transform",function(d){
                return "translate(" + d.tip_x + "," + d.tip_y + ")";
            });

        })(model.enter().append("g"), this.options);
    };

    // calcurate height and width that are necessary for rendering the tool-tip
    Tooltip.prototype.processData = function(lists){
        var options = this.options;

        // calcurate shape and center point of tool-tip
        var calcPoints = function(pos, width, height){
            var arr_w = options.arrow_width;
            var arr_h = options.arrow_height;
            var tt_w = width;
            var tt_h = height;
            var points = {
                'top':[
                    {x:0, y:0},{x:arr_w/2, y:-arr_h},
                    {x:tt_w/2, y:-arr_h},{x:tt_w/2, y:-arr_h-tt_h},
                    {x:-tt_w/2, y:-arr_h-tt_h},{x:-tt_w/2, y:-arr_h},
                    {x:-arr_w/2, y:-arr_h},{x:0, y:0}
                ],
                'right':[
                    {x:0, y:0},{x:-arr_w, y:-arr_h/2},
                    {x:-arr_w, y:-tt_h/2},{x:-arr_w-tt_w, y:-tt_h/2},
                    {x:-arr_w-tt_w, y:tt_h/2},{x:-arr_w, y:tt_h/2},
                    {x:-arr_w, y:arr_h/2},{x:0, y:0}
                ]
            };
            points['bottom'] = _.map(points['top'], function(p){return {x:p.x, y:-p.y};});
            points['left'] = _.map(points['right'], function(p){return {x:-p.x, y:p.y};});

            var center = (function(p){
                var result={};
                switch(pos){
                case 'top': case 'bottom':
                    result = {x:0, y:(p[2].y+p[3].y)/2};
                    break;
                case 'right': case 'left':
                    result = {x:(p[2].x+p[3].x)/2, y:0};
                    break;
                }
                return result;
            })(points[pos]);

            return {shape:points[pos], text: center};
        };

        var margin = this.options.tooltip_margin;
        var context_height = this.options.context_height;
        var scales = this.scales;
        var model = this.model;

        var calcText = function(text, size){
            var dom = model.append("text").text(text).attr("font-size", size).style("font-family", options.font);
            var text_width = dom[0][0].getBBox().width;
            var text_height = dom[0][0].getBBox().height;
            dom.remove();
            return {w: text_width, h:text_height};
        };

        return _.map(lists, function(list){
            var text_num = (_.isArray(list.contents) ? list.contents.length : 1);
            var str = (_.isArray(list.contents) ? _.max(list.contents, function(d){return d.length;}) : list.contents);

            var text_size = calcText(str, options.font_size);
            var tip_width = text_size.w + margin.left + margin.right;
            var tip_height = (text_size.h + margin.top + margin.bottom)*text_num;

            var point = scales.get(list.x, list.y);
            var tip_x = (list.x == "left" ? 0 : point.x);
            var tip_y = (list.y == "bottom" ? context_height : point.y);

            var points = calcPoints(list.pos, tip_width, tip_height);

            var text_y;
            if(_.isArray(list.contents)){
                var len = list.contents.length;
                text_y = _.map(list.contents, function(str, i){
                    return (points.text.y - text_size.h/2*(len-2)) + text_size.h*i;
                });
            }else{
                text_y = points.text.y + text_size.h/2;
            }

            return {
                shape: points.shape,
                tip_x: tip_x,
                tip_y: tip_y,
                text_x: points.text.x,
                text_y: text_y,
                text: list.contents
            };
        });
    };

    return Tooltip;
});

/*
 * Pane: 
 *
 * Pane keeps dom objects which diagrams, filter, and legend will be placed on. Pane will tell each diagram, axis, and scale to update.
 * It also calcurate scales and each diagram and axis will be rendered according to the scales.
 *
 * options (summary) :
 *    rotate_x_label      -> (Float) : rotate labels placed on x-axis (radian)
 *    zoom                -> (Bool)  : Decide whether to allow zooming and pan
 *    grid                -> (Bool)  : Decide whether to draw grid line on pane.
 *    legend_position     -> (Object): String like 'right', 'left', 'top' and 'bottom', or Array like [0, 19] are allowed. The latter is coordinates in the plotting area.
 *    scale:              -> (String): The type of axis. 'linear', 'log' and 'power' are allowed.
 *    scale_extra_options -> (Object): extra options for extension which has different coordinates system except x-y.
 *    axis_extra_options  -> (Object): extra options for extension.
 */

define('view/pane',[
    'underscore',
    'node-uuid',
    'view/diagrams/diagrams',
    'view/components/filter',
    'view/components/legend_area',
    'view/components/tooltip'
],function(_, uuid, diagrams, Filter, LegendArea, Tooltip){
    function Pane(parent, scale, Axis, _options){
        var options = {
            width: 700,
            height: 500,
            margin: {top: 30, bottom: 80, left: 80, right: 30},
            xrange: [0,0],
            yrange: [0,0],
            x_label:'X',
            y_label:'Y',
            rotate_x_label: 0,
            rotate_y_label:0,
            zoom: false,
            grid: true,
            zoom_range: [0.5, 5],
            bg_color: '#eee',
            grid_color: '#fff',
            legend: false,
            legend_position: 'right',
            legend_width: 150,
            legend_height: 300,
            legend_stroke_color: '#000',
            legend_stroke_width: 0,
            font: "Helvetica, Arial, sans-serif",
            x_scale: 'linear',
	    y_scale: 'linear',
            scale_extra_options: {},
            axis_extra_options: {}
        };
        if(arguments.length>1)_.extend(options, _options);

        this.uuid = uuid.v4();

        var model = parent.append("svg")
                .attr("width", options.width)
                .attr("height", options.height);

        var areas = (function(){
            var areas = {};
            areas.plot_x = options.margin.left;
            areas.plot_y = options.margin.top;
            areas.plot_width = options.width - options.margin.left - options.margin.right;
            areas.plot_height = options.height - options.margin.top - options.margin.bottom;
            
            if(options.legend){
                switch(options.legend_position){
                case 'top':
                    areas.plot_width -= options.legend_width;
                    areas.plot_y += options.legend_height;
                    areas.legend_x = (options.width - options.legend_width)/2;
                    areas.legend_y = options.margin.top;
                    break;

                case 'bottom':
                    areas.plot_height -= options.legend_height;
                    areas.legend_x = (options.width - options.legend_width)/2;
                    areas.legend_y = options.margin.top + options.height;
                    break;

                case 'left':
                    areas.plot_x += options.legend_width;
                    areas.plot_width -= options.legend_width;
                    areas.legend_x = options.margin.left;
                    areas.legend_y = options.margin.top;
                    break;

                case 'right':
                    areas.plot_width -= options.legend_width;
                    areas.legend_x = areas.plot_width + options.margin.left;
                    areas.legend_y = options.margin.top;
                    break;

                case _.isArray(options.legend_position):
                    areas.legend_x = options.width * options.legend_position[0];
                    areas.legend_y = options.height * options.legend_position[1];
                    break;
                }
            }
            return areas;
        })();

        var scales = (function(){
            var domains = {x: options.xrange, y:options.yrange};
            var ranges = {x:[0,areas.plot_width], y:[areas.plot_height,0]};
            return new scale(domains, ranges, {
		x: options.x_scale,
		y: options.y_scale,
                extra: options.scale_extra_options
            });
        })();

        // add background
        model.append("g")
            .attr("transform", "translate(" + areas.plot_x + "," + areas.plot_y + ")")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", areas.plot_width)
            .attr("height", areas.plot_height)
            .attr("fill", options.bg_color)
            .style("z-index",1);

        var axis = new Axis(model.select("g"), scales, {
            width:areas.plot_width,
            height:areas.plot_height,
            margin:options.margin,
            grid:options.grid,
            zoom:options.zoom,
            zoom_range:options.zoom_range,
            x_label:options.x_label,
            y_label:options.y_label,
            rotate_x_label:options.rotate_x_label,
            rotate_y_label:options.rotate_y_label,
            stroke_color: options.grid_color,
            pane_uuid: this.uuid,
            z_index:100,
            extra: options.axis_extra_options
        });

        // add context
        model.select("g")
            .append("g")
            .attr("class", "context")
            .append("clipPath")
            .attr("id", this.uuid + "clip_context")
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", areas.plot_width)
            .attr("height", areas.plot_height);

        model.select(".context")
            .attr("clip-path","url(#" + this.uuid + 'clip_context' + ")");

        model.select("g")
            .append("rect")
            .attr("x", -1)
            .attr("y", -1)
            .attr("width", areas.plot_width+2)
            .attr("height", areas.plot_height+2)
            .attr("fill", "none")
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .style("z-index", 200);

        // add tooltip
        var tooltip = new Tooltip(model.select("g"), scales, {
            font: options.font,
            context_width: areas.plot_width,
            context_height: areas.plot_height,
            context_margin: {
                top: areas.plot_x,
                left: areas.plot_y,
                bottom: options.margin.bottom,
                right: options.margin.right
            }
        });

        // add legend
        if(options.legend){
            model.append("g")
                .attr("class", "legend_area")
                .attr("transform", "translate(" + areas.legend_x + "," + areas.legend_y + ")");

            this.legend_area = new LegendArea(model.select(".legend_area"), {
                width: options.legend_width,
                height: options.legend_height,
                stroke_color: options.legend_stroke_color,
                stroke_width: options.legend_stroke_width
            });
        }

        this.diagrams = [];
        this.tooltip = tooltip;
        this.context = model.select(".context").append("g").attr("class","context_child");
        this.model = model;
        this.scales = scales;
        this.options = options;
        this.filter = null;
        return this;
    }

    // Add diagram to pane
    Pane.prototype.addDiagram = function(type, data, options){
        _.extend(options, {
            uuid: uuid.v4(),
            tooltip: this.tooltip
        });

        var diagram = new diagrams[type](this.context, this.scales, data, options);

        if(this.options.legend){
            var legend_area = this.legend_area;
            var legend = diagram.getLegend();
            if(_.isArray(legend))_.each(legend, function(l){
                legend_area.add(l);
            });
            else this.legend_area.add(legend);
	    }

	    this.diagrams.push(diagram);
    };

    // Add filter to pane (usually a gray box on the pane)
    Pane.prototype.addFilter = function(target, options){
	    var diagrams = this.diagrams;
	    var callback = function(ranges){
	        _.each(diagrams, function(diagram){
		        diagram.checkSelectedData(ranges);
	        });
	    };
	    this.filter = new Filter(this.context, this.scales, callback, options);
    };

    // Update all diagrams belong to the pane
    Pane.prototype.update = function(){
        var font = this.options.font;
	    _.each(this.diagrams, function(diagram){
	        diagram.update();
	    });

        this.model.selectAll("text")
            .style("font-family", font);
    };

    return Pane;
});

/*
 * Axis:
 *
 * Axis generates x and y axies for plot. It also controlls grids.
 * Have a look at documents on d3.svg.axis and d3.behavior.zoom to learn more.
 *
 * options (summary) :
 *    width     -> (Float) : Width of *context area*.
 *    height    -> (Float) : Height of *context area*.
 *    margin    -> (Object): Margin outside of context area. used when adding axis labels.
 *    pane_uuid -> (Float) : Given by pane itself. used to tell update information to Manager.
 *    z_index   -> (Float) : Given by pane. Usually axis are placed below context and over backgroupd.
 */

define('view/components/axis',[
    'underscore',
    'core/manager'
],function(_, Manager){
    function Axis(parent, scales, _options){
        var options = {
            width:0,
            height:0,
            margin: {top:0,bottom:0,left:0,right:0},
            stroke_color:"#fff",
            stroke_width: 1.0,
            x_label:'X',
            y_label:'Y',
            grid:true,
            zoom:false,
            zoom_range:[0.5, 5],
            rotate_x_label:0,
            rotate_y_label:0,
            pane_uuid: null,
            z_index:0
        };
        if(arguments.length>2)_.extend(options, _options);

        var xAxis = d3.svg.axis()
                .scale(scales.raw.x)
                .orient("bottom");

        var yAxis = d3.svg.axis()
                .scale(scales.raw.y)
                .orient("left");

        parent.append("g")
            .attr("class", "x_axis");

        parent.append("g")
            .attr("class", "y_axis");

        parent.append("text")
            .attr("x", options.width/2)
            .attr("y", options.height + options.margin.bottom/1.5)
            .attr("text-anchor", "middle")
            .attr("fill", "rgb(50,50,50)")
            .attr("font-size", 22)
            .text(options.x_label);

        parent.append("text")
            .attr("x", -options.margin.left/1.5)
            .attr("y", options.height/2)
            .attr("text-anchor", "middle")
            .attr("fill", "rgb(50,50,50)")
            .attr("font-size", 22)
            .attr("transform", "rotate(-90," + -options.margin.left/1.5 + ',' + options.height/2 + ")")
            .text(options.y_label);

        var update = function(){
            parent.select(".x_axis").call(xAxis);
            parent.select(".y_axis").call(yAxis);

            parent.selectAll(".x_axis, .y_axis")
                .selectAll("path, line")
                .style("z-index", options.z_index)
                .style("fill","none")
                .style("stroke",options.stroke_color)
                .style("stroke-width",options.stroke_width);

            parent.selectAll(".x_axis, .y_axis")
                .selectAll("text")
                .attr("fill", "rgb(50,50,50)");

            parent.selectAll(".x_axis")
                .attr("transform", "translate(0," + (options.height + 4) + ")");

            parent.selectAll(".y_axis")
                .attr("transform", "translate(-4,0)");
            
            if(options.rotate_x_label != 0){
                parent.selectAll(".x_axis")
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("transform", function(d) {
                        return "rotate(" + options.rotate_x_label + ")";
                    });
            }

            if(options.rotate_y_label != 0){
                parent.selectAll(".y_axis")
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("transform", function(d) {
                        return "rotate(" + options.rotate_y_label + ")";
                    });
            }

            Manager.update(options.pane_uuid);
        };

        if(options.grid){
            xAxis.tickSize((-1)*options.height);
            yAxis.tickSize((-1)*options.width);
        }

        if(options.zoom){
            var zoom = d3.behavior.zoom()
                    .x(scales.raw.x)
                    .y(scales.raw.y)
                    .scaleExtent(options.zoom_range)
                    .on("zoom", update);
            parent.call(zoom);
            parent.on("dblclick.zoom", null);
        }

        update();

        this.model = parent;
        return this;
    }

    return Axis;
});

/*
 * Scales: The wrapper for d3.scales
 *
 * Scales for x-y coordinates system. Other types of scales are implemented by extension system like Bionya and Mapnya.
 * If you are interested in writing extension for Nyaplot, see the code of extensions.
 * This module is implemented using d3.scales.ordinal and d3.scales.linear. See the document of d3.js to learn more about scales: 
 *    - https://github.com/mbostock/d3/wiki/Ordinal-Scales
 *    - https://github.com/mbostock/d3/wiki/Quantitative-Scales
 * 
 * options:
 *     linear -> String: The type of linear scale. 'linear', 'power', and 'log' are allowed.
 */

define('view/components/scale',['underscore'], function(_){
    function Scales(domains, ranges, _options){
        var options = {
	    x: 'linear',
	    y: 'linear'
        };
        if(arguments.length>1)_.extend(options, _options);

        var scales = {};
        _.each(['x', 'y'],function(label){
            if(_.some(domains[label], function(val){
                return _.isString(val);
            })){
                scales[label] = d3.scale.ordinal()
                    .domain(domains[label])
                    .rangeBands(ranges[label]);
            }
            else{
                var scale = (d3.scale[options[label]])();
		if(options[label] == "log")
                    scales[label] = scale
		    .base(Math.E)
                    .domain(domains[label])
                    .range(ranges[label]);
		else
                    scales[label] = scale
                    .domain(domains[label])
                    .range(ranges[label]);
            }
        });
        this.scales = scales;
        this.raw = scales;
        return this;
    }

    // convert from data points to svg dom coordiantes like: ['nya', 'hoge'] -> {x: 23, y:56}]
    Scales.prototype.get = function(x, y){
        return {
            x: this.scales.x(x),
            y: this.scales.y(y)
        };
    };

    // domain: the word unique to d3.js. See the website of d3.js.
    Scales.prototype.domain = function(){
        return {
            x: this.scales.x.domain(),
            y: this.scales.y.domain()
        };
    };

    // range: the word unique to d3.js. See the website of d3.js.
    Scales.prototype.range = function(){
        return {
            x: this.scales.x.range(),
            y: this.scales.y.range()
        };
    };

    return Scales;
});

/*
 * STL:
 *
 * Standard library for Nyaplot
 */

define('core/stl',['require','exports','module','view/pane','view/components/axis','view/components/scale'],function(require, exports, module){
    var stl = {};
    stl.pane = require('view/pane');
    stl.axis = require('view/components/axis');
    stl.scale = require('view/components/scale');
    return stl;
});

/*
 * Extension:
 *
 * Extension keeps information about extensions for Nyaplot.
 *
 */

define('core/extension',[
    'underscore',
    'core/stl',
    'view/diagrams/diagrams'
],function(_, STL, diagrams){
    var Extension = {};
    var buffer={};

    // load extension
    Extension.load = function(extension_name){
        if(typeof window[extension_name] == "undefined")return;
        if(typeof window[extension_name]['Nya'] == "undefined")return;

        var ext_info = window[extension_name].Nya;

        _.each(['pane', 'scale', 'axis'], function(component){
            if(typeof ext_info[component] == "undefined")
                ext_info[component] = STL[component];
        });

        if(typeof ext_info['diagrams'] != "undefined"){
            _.each(ext_info['diagrams'], function(content, name){
                diagrams.add(name, content);
            });
        }

        buffer[extension_name] = ext_info;
    };

    Extension.get = function(name){
        return buffer[name];
    };

    return Extension;
});

/*
 * Dataframe:
 *
 * Dataframe loads (JSON) data or through a URI and allows
 * a plot to query that data
 */

define('utils/dataframe',[
    'underscore'  // module
],function(_){
    function Dataframe(name, data){
        // load data from a String containing a URL or
        // use the (raw) data
        if(data instanceof String && /url(.+)/g.test(data)){
            var url = data.match(/url\((.+)\)/)[1];
            var df = this;
            d3.json(url, function(error, json){
                df.raw = JSON.parse(json);
            });
            this.raw = {};
        }
        else this.raw = data;

        // detect the nested column (that should be only one)
        var header = _.keys(data[0]);
        var rows = _.zip.apply(this, _.map(data, function(row, i){
            return _.toArray(row);
        }));
        var nested = _.filter(rows, function(column){
            return _.all(column, function(val){return _.isArray(val);});
        });
        if(nested.length == 1){
            this.nested = header[rows.indexOf(nested[0])];
        }else this.nested = false;

        this.filters = {};
        return this;
    }
    
    // Get a row by index
    Dataframe.prototype.row = function(row_num){
        return this.raw[row_num];
    };

    // Get a column by label
    Dataframe.prototype.column = function(label){
        var arr = [];
        var raw = this.raw;
        _.each(raw, function(row){arr.push(row[label]);});
        return arr;
    };

    // Get a scale
    Dataframe.prototype.scale = function(column_name, range){
        if(this.isContinuous(column_name)){
            var domain = this.columnRange(column_name);
            domain = _.range(domain.min, domain.max+1, (domain.max-domain.min)/(range.length-1));
            return d3.scale.linear().domain(domain).range(range);
        }else{
            return d3.scale.ordinal().domain(_.uniq(this.column(column_name))).range(range);
        };
    };

    // Check if the specified column consists of continuous data
    Dataframe.prototype.isContinuous = function(column_name){
        return _.every(this.column(column_name), function(val){return _.isNumber(val);});
    };

    // Add a filter function to the list
    Dataframe.prototype.addFilter = function(self_uuid, func, excepts){
        this.filters[self_uuid] = {func:func, excepts:excepts};
    };

    // Iterate a column using filters
    Dataframe.prototype.columnWithFilters = function(self_uuid, label){
        var raw = this.raw.concat();
        _.each(this.filters, function(filter, uuid){
            if(filter.excepts.indexOf('self') != -1 && uuid==self_uuid)return;
            if(!(self_uuid in filter.excepts))
                raw = _.filter(raw, filter.func);
        });
        return _.map(raw, function(row){return row[label];});
    };

    // Fetch a value using column label and row number
    Dataframe.prototype.pickUpCells = function(label, row_nums){
        var column = this.column(label);
        return _.map(row_nums, function(i){
            return column[i];
        });
    };

    // Fetch partical dataframe as the format like [{a:1, b:2, c:3}, ...,{a:1, b:2, c:3}] using column names
    Dataframe.prototype.getPartialDf = function(column_names){
        return _.map(this.raw, function(row){
            return _.reduce(column_names, function(memo, name){
                memo[name] = row[name];
                return memo;
            }, {});
        });
    };

    // experimental implementation of accessor to nested dataframe.
    Dataframe.prototype.nested_column = function(row_num, name){
        if(!this.nested)throw "Recieved dataframe is not nested.";
        var df = new Dataframe('', this.row(row_num)[this.nested]);
        return df.column(name);
    };

    // return the range of values in specified column
    Dataframe.prototype.columnRange = function(label){
        var column = this.column(label);
        return {
            max: d3.max(column, function(val){return val;}),
            min: d3.min(column, function(val){return val;})
        };
    };

    return Dataframe;
});

/*
 * parse:
 *
 * parse JSON model and generate plots based on the order.
 *
 */

define('core/parse',[
    'underscore',
    'core/manager',
    'core/extension',
    'core/stl',
    'utils/dataframe'
],function(_, Manager, Extension, STL, Dataframe){
    function parse(model, element_name){
        var element = d3.select(element_name);

        if(typeof model['extension'] !== "undefined"){
            if(_.isArray(model['extension'])){
                _.each(model['extension'], function(ex){
                    Extension.load(ex);
                });
            }else{
                Extension.load(model['extension']);
            }
        }

        parse_model(model, element);
    }

    function parse_model(model, element){
        _.each(model.data, function(value, name){
            Manager.addData(name, new Dataframe(name, value));
        });

        _.each(model.panes, function(pane_model){
            var pane;

            var pane_proto, axis, scale;
            if(typeof pane_model['extension'] !== "undefined"){
                var ext = Extension.get(pane_model['extension']);
                pane_proto = ext.pane;
                axis = ext.axis;
                scale = ext.scale;
            }else{
                pane_proto = STL.pane;
                axis = STL.axis;
                scale = STL.scale;
            }
            pane = new pane_proto(element, scale, axis, pane_model.options);

            var data_list = [];
            _.each(pane_model.diagrams, function(diagram){
                pane.addDiagram(diagram.type, diagram.data, diagram.options || {});
                data_list.push(diagram.data);
            });

            if(pane_model['filter'] !== undefined){
                var filter = pane_model.filter;
                pane.addFilter(filter.type, filter.options || {});
            }

            Manager.addPane({pane:pane, data: data_list, uuid:pane.uuid});
            Manager.update(pane.uuid);
        });
    };

    return parse;
});

define('main',['require','exports','module','core/parse','core/stl','core/manager','node-uuid','underscore'],function(require, exports, module){
    var Nyaplot = {};

    Nyaplot.core = {};
    Nyaplot.core.parse = require('core/parse');

    Nyaplot.STL = require('core/stl');
    Nyaplot.Manager = require('core/manager');
    Nyaplot.uuid = require('node-uuid');
    Nyaplot._ = require('underscore');

    return Nyaplot;
});

return require('main');
}));