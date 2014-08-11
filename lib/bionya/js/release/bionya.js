(function (root, initialize){
    var Bionya = initialize();
    if(typeof define !== "undefined" && define.amd)define(Bionya);
    root.Bionya = Bionya;
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

define("contrib/almond/almond", function(){});

define('tools',[], function(){
    var Tools = {
        STL: Nyaplot.STL,
        _: Nyaplot._,
        uuid: Nyaplot.uuid,
        Manager: Nyaplot.Manager
    };

    return Tools;
});

define('components/scale',['tools'], function(Tools){
    var _ = Tools._;

    function scale(domains, ranges, _options){
        var width = Math.abs(ranges.x[1] - ranges.x[0]);
        var height = Math.abs(ranges.y[1] - ranges.y[0]);

        this.scales = {};
        this.center = {x: width/2, y: height/2};
        this.max_r = Math.min(width, height)/2;
        return this;
    }

    scale.prototype.init = function(inner_radius, outer_radius, inner_num, outer_num){
        this.inner_radius = inner_radius;
        this.outer_radius = outer_radius;
        this.inner_num = inner_num;
        this.outer_num = outer_num;
        this.inner_thickness = inner_radius/(inner_num+1);
        this.outer_thickness = (this.max_r - outer_radius)/outer_num;
    };

    scale.prototype.addGroup = function(name, axis, startAngle, endAngle){
        var scale = d3.scale.ordinal().domain(axis).rangePoints([startAngle, endAngle], 1);
        this.scales[name] = scale;
        this.width = (endAngle - startAngle)/(axis.length+1);
    };

    scale.prototype.groups = function(){
        return _.keys(this.scales);
    };

    scale.prototype.getWidth = function(){
        return this.width;
    };

    scale.prototype.getHeight = function(layer){
        if(layer >= 0)return this.outer_thickness;
        else return this.inner_thickness;
    };

    scale.prototype.getCenter = function(){
        return this.center;
    };

    scale.prototype.getRange = function(layer){
        var min, max;
        if(layer > 0){
            min = this.outer_radius + this.outer_thickness*(layer-1);
            max = min + this.outer_thickness;
        }else{
            max = this.inner_radius;
            min = max - this.inner_thickness;
        }
        return [min, max];
    };

    scale.prototype.get = function(layer, group, x){
        var r, theta;
        if(layer > 0)r = this.outer_radius + this.outer_thickness*layer;
        else r = this.inner_radius - this.inner_thickness*layer*-1;
        theta = this.scales[group](x);
        return {x: r*Math.cos(theta), y: r*Math.sin(theta), r:r, theta:theta};
    };

    return scale;
});

define('components/axis',['tools'], function(Tools){
    function Axis(parent, scales, _options){
        var _ = Tools._;
        var Manager = Tools.Manager;

        var options = {
            width:0,
            height:0,
            margin: {top:0,bottom:0,left:0,right:0},
            x_label:'X',
            y_label:'Y',
            zoom:true,
            zoom_range:[0.5, 5],
            rotate_x_label:0,
            rotate_y_label:0,
            pane_uuid: null,
            z_index:0,
            color: ['#253494'],
            text_color: '#fff',
            extra: {}
        };

        var options_extra = {
            df_id: null,
            inner_radius: 150,
            outer_radius: 170,
            group_by: null,
            axis: null,
            chord: false,
            matrix: null,
            inner_num: 0,
            outer_num: 1
        };

        if(arguments.length>2){
            _.extend(options, _options);
            _.extend(options_extra, _options.extra);
            options.extra = options_extra;
        }

        var df = Manager.getData(options.extra.df_id);
        var groups = df.column(options.extra.group_by);
        var axies = {};
        var matrix = (options.extra.chord ? options.extra.matrix: []);
        var fill_scale = d3.scale.ordinal().range(options.color);

        _.each(groups, function(group, i){
            var axis = df.nested_column(i, options.extra.axis);
            axies[group] = axis;
            if(options.extra.matrix==null){
                matrix[i] = [];
                for(var j=0; j<groups.length; j++){
                    if(j==i)matrix[i][j] = axis.length;
                    else matrix[i][j] = 0;
                }
            }
        });

        var chord = d3.layout.chord()
                .padding(.05)
                .matrix(matrix);

        var model = parent.append("g")
                .attr('transform', 'translate(' + options.width/2 + ',' + options.height/2 + ')');

        // group arcs
        model.append("g")
            .selectAll("g")
            .data(chord.groups)
            .enter().append("g")
            .attr("class", "group_arcs")
            .append("path")
            .style("fill", function(d){return fill_scale(d.index);})
            .style("stroke", function(d){return fill_scale(d.index);})
            .attr("d", d3.svg.arc()
                  .innerRadius(options.extra.inner_radius)
                  .outerRadius(options.extra.outer_radius))
            .attr("id", function(d, i){return "group"+i;});

        // labels for group arcs
        model.selectAll(".group_arcs")
            .append("text")
            .attr("x",6)
            .attr("dy",15)
            .append("textPath")
            .attr("xlink:href", function(d,i){return "#group" + i;})
            .text(function(d,i){return groups[i];})
            .attr("fill", options.text_color);

        // chord
        if(options.extra.chord){
            model.append("g").selectAll("path")
                .data(chord.chords)
                .enter().append("path")
                .attr("d", d3.svg.chord().radius(options.extra.inner_radius))
                .style("fill", "#fff");
        }

        // scales
        scales.init(
            options.extra.inner_radius, options.extra.outer_radius,
            options.extra.inner_num, options.extra.outer_num);

        model.selectAll(".group_arcs").each(function(d, i){
            scales.addGroup(groups[i], axies[groups[i]], d.startAngle, d.endAngle);
        });

        // tick
        var tick_data = _.flatten(_.map(axies, function(x_arr, group){
            return _.map(x_arr, function(x){
                return scales.get(0, group, x);
            });
        }));

        model.append("g")
            .attr("class", "ticks")
            .selectAll("g")
            .data(tick_data).enter()
            .append("g")
            .attr("transform", function(d){
                return "rotate(" + 180*(d.theta/Math.PI) + ") translate(0," + (-1* options.extra.outer_radius) + ")";
            })
            .append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", -5)
            .attr("stroke", "#000");
        
        if(options.zoom){
            parent.call(
                d3.behavior.zoom()
                    .scaleExtent(options.zoom_range)
                    .on("zoom", function(){
                        parent.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
                    }));
        }
    }

    return Axis;
});

define('diagrams/arc',['tools'], function(Tools){
    var _ = Tools._;
    var Manager = Tools.Manager;

    function Arc(parent, scales, df_id, _options){
        var options = {
            range: [0, 0],
            width: 0.5,
            color: ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)' ,'rgb(202,178,214)'],
            fill_by: null,
            x: null,
            y: null,
            layer: 1,
            axis: true
        };
        if(arguments.length>3)_.extend(options, _options);

        this.height_scale = (function(){
            var height = scales.getHeight(options.layer);
            return d3.scale.linear().domain(options.range).range([0, height]);
        })();

        this.inner_radius = scales.getRange(options.layer)[0];
        this.model = (function(){
            var center = scales.getCenter();
            return parent.append("g").attr('transform', 'translate(' + center.x + ',' + center.y + ')');
        })();
        this.scales = scales;
        this.df = Manager.getData(df_id);
        this.color_scale = d3.scale.ordinal().range(options.color);
        this.uuid = options.uuid;
        this.options = options;

        return this;
    };
    
    Arc.prototype.update = function(){
        var groups = this.scales.groups();
        var thisObj = this;

        if(this.options.axis){
            (function(){
                var values = thisObj.height_scale.ticks(5);
                values.reverse().pop();

                var group = thisObj.model
                    .append("g")
                    .selectAll("g")
                    .data(values)
                    .enter()
                    .append("g");

                group.append("circle")
                    .attr("fill", "none")
                    .attr("stroke", "#000")
                    .attr("r", function(d){return thisObj.inner_radius + thisObj.height_scale(d);});

                group.append("text")
                    .attr("y", function(d){return -1*(thisObj.inner_radius + thisObj.height_scale(d) + 4);})
                    .text(function(d){return d;});
            })();
        }

        _.each(groups, function(group, i){
            var x = thisObj.df.nested_column(i, thisObj.options.x);
            var y = thisObj.df.nested_column(i, thisObj.options.y);
            var data = thisObj.processData(group, x, y);
            thisObj.updateModels(data);
        });
    };

    Arc.prototype.processData = function(group, x_arr, y_arr){
        var thisObj = this;
        return _.map(x_arr, function(x, i){
            var hash = thisObj.scales.get(thisObj.options.layer, group, x);
            hash['height'] = thisObj.height_scale(y_arr[i]);
            return hash;
        });
    };

    Arc.prototype.updateModels = function(data){
        var inner_radius = this.inner_radius;
        var width = this.scales.getWidth() * this.options.width;
        var color_scale = this.color_scale;

        this.model.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", d3.svg.arc()
                  .startAngle(function(d){return d.theta - width/2;})
                  .endAngle(function(d){return d.theta + width/2;})
                  .innerRadius(inner_radius)
                  .outerRadius(function(d){return inner_radius + d.height;}))
            .attr("stroke", function(d, i){return color_scale(i);})
            .attr("fill", function(d, i){return color_scale(i);});
    };

    Arc.prototype.getLegend = function(){
    };

    Arc.prototype.checkSelectedData = function(ranges){
        return;
    };
    
    return Arc;
});

define('main',['require','exports','module','components/scale','components/axis','diagrams/arc'],function(require, exports, module){
    var Bionya = {};
    Bionya.Nya = {
        'scale':require('components/scale'),
        'axis':require('components/axis'),
        'diagrams': {
            'arc': require('diagrams/arc')
        }
    };

    return Bionya;
});

return require('main');
}));