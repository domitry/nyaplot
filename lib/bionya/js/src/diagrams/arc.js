define(['tools'], function(Tools){
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
            var fill_scale = (function(){
                var color = thisObj.options.color;
                if(thisObj.options.fill_by){
                    var fill_by = thisObj.options.fill_by;
                    var scale = thisObj.df.scale(fill_by, color);
                    var pairs = _.zip.apply(null, _.map(thisObj.df.column(fill_by), function(val, i){
                        return [i, scale(val)];
                    }));
                    return d3.scale.ordinal().domain(pairs[0]).range(pairs[1]);
                }else{
                    return d3.scale.ordinal().range(color);
                }
            })();
            var data = thisObj.processData(group, x, y, fill_scale);
            thisObj.updateModels(data);
        });
    };

    Arc.prototype.processData = function(group, x_arr, y_arr, fill_scale){
        var thisObj = this;
        return _.map(x_arr, function(x, i){
            var hash = thisObj.scales.get(thisObj.options.layer, group, x);
            hash['height'] = thisObj.height_scale(y_arr[i]);
            hash['fill'] = fill_scale(i);
            return hash;
        });
    };

    Arc.prototype.updateModels = function(data){
        var baseline = this.height_scale(0);
        var inner_radius = this.inner_radius;
        var width = this.scales.getWidth() * this.options.width;

        this.model.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", d3.svg.arc()
                  .startAngle(function(d){return d.theta - width/2;})
                  .endAngle(function(d){return d.theta + width/2;})
                  .innerRadius(inner_radius + baseline)
                  .outerRadius(function(d){return inner_radius + d.height;}))
            .attr("stroke", function(d){return d.fill;})
            .attr("fill", function(d){return d.fill;});
    };

    Arc.prototype.getLegend = function(){
    };

    Arc.prototype.checkSelectedData = function(ranges){
        return;
    };
    
    return Arc;
});
