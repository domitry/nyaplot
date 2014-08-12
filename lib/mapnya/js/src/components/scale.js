define(['tools'], function(Tools){
    var _ = Tools._;

    function scale(domains, ranges, _options){
        var width = Math.abs(ranges.x[1] - ranges.x[0]);
        var height = Math.abs(ranges.y[1] - ranges.y[0]);
        return this;
    }

    scale.prototype.init = function(projection){
        this.projection = projection;
    };

    scale.prototype.get = function(longitude, latitude){
        var point = this.projection.projection(longitude, latitude);
        return {x: point[0], y:point[1]};
    };

    return scale;
});
