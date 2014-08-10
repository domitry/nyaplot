define(['tools'], function(Tools){
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
