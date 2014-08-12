define(['tools'], function(Tools){
    var _ = Tools._;

    function scale(domains, ranges, _options){
        var width = Math.abs(ranges.x[1] - ranges.x[0]);
        var height = Math.abs(ranges.y[1] - ranges.y[0]);
        this.offset = {x: 0, y:0};
        this.scale = 1;
        return this;
    }

    scale.prototype.init = function(projection){
        this.projection = projection;
    };

    scale.prototype.get = function(longitude, latitude){
        var point = this.projection([longitude, latitude]);
        return {
            x: point[0]*this.scale + this.offset.x,
            y: point[1]*this.scale + this.offset.y
        };
    };

    scale.prototype.setTranslate = function(x, y){
        this.offset.x = x;
        this.offset.y = y;
    };

    scale.prototype.setScale = function(scale){
        this.scale = scale;
    };

    return scale;
});
