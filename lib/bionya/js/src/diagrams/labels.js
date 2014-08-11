define(['tools'], function(Tools){
    var _ = Tools._;
    var Manager = Tools.Manager;

    function Labels(parent, scales, df_id, _options){
        var options = {
            color: "#000",
            fill_by: null,
            x: null,
            text: null,
            stroke_width: 4,
            layer: 1
        };
        if(arguments.length>3)_.extend(options, _options);

        this.model = (function(){
            var center = scales.getCenter();
            return parent.append("g").attr('transform', 'translate(' + center.x + ',' + center.y + ')');
        })();

        this.scales = scales;
        this.df = Manager.getData(df_id);
        this.uuid = options.uuid;
        this.options = options;
    }

    Labels.prototype.update = function(){
        var groups = this.scales.groups();
        var thisObj = this;
        _.each(groups, function(group, i){
            var x = thisObj.df.nested_column(i, thisObj.options.x);
            var text = thisObj.df.nested_column(i, thisObj.options.text);
            var data = thisObj.processData(group, x, text);
            thisObj.updateModels(data);
        });
    };
    
    Labels.prototype.processData = function(group, x, text){
        var scales = this.scales, layer = this.options.layer;
        return _.filter(_.map(_.zip(x, text), function(row){
            return {theta: scales.get(layer, group, row[0]).theta,text: row[1]};
        }), function(row){return row.text != null && row.text.length > 0;});
    };

    Labels.prototype.updateModels = function(data){
        var scales = this.scales, layer = this.options.layer, options = this.options;
        var inner_radius = scales.getRange(layer)[0];

        var groups = this.model.append("g")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function(d){
                    return "rotate(" + 180*((d.theta-Math.PI/2)/Math.PI) + ")";
                });
        
        groups.append("text")
            .text(function(d){return d.text;})
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .attr("fill", options.color)
            .attr("x", inner_radius + 10)
            .attr("y", 0);

        groups.append("line")
            .attr("x1", inner_radius)
            .attr("x2", inner_radius + 5)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "#000");
    };

    Labels.prototype.getLegend = function(){
        return;
    };

    Labels.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Labels;
});
