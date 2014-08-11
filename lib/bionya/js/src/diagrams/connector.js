define(['tools'], function(Tools){
    var _ = Tools._;
    var Manager = Tools.Manager;

    function Connector(parent, scales, df_id, _options){
        var options = {
            color: "#000",
            fill_by: null,
            from: null,
            to: null,
            shape: 'circle',
            stroke_width: 4,
            size: 100,
            shape_fill: '#fff',
            shape_stroke: '#3182bd',
            shape_stroke_width: 2,
            layer: 0
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

    Connector.prototype.update = function(){
        var from = this.df.column(this.options.from);
        var to = this.df.column(this.options.to);
        var data = this.processData(from, to);
        this.updateModels(data);
    };
    
    Connector.prototype.processData = function(from ,to){
        var scales = this.scales, layer = this.options.layer;

        return _.zip.apply(null, _.map([from, to], function(column){
            var arr =  _.map(column, function(str){
                var strs = str.split(/(.+)\.(.+)/);
                var group = strs[1], x = strs[2];
                var point = scales.get(layer, group, x);
                return {x: point.x, y: point.y};
            });
            return arr;
        }));
    };

    Connector.prototype.updateModels = function(data){
        var scales = this.scales;
        var layer = this.layer;
        var options = this.options;

        var groups = this.model.selectAll("g")
                .data(data)
                .enter()
                .append("g");
        
        groups.append("path")
            .attr("d", d3.svg.line()
                  .interpolate("bundle")
                  .tension(0.1)
                  .x(function(d){return d.x;})
                  .y(function(d){return d.y;}))
            .attr("stroke", options.color)
            .attr("stroke-width", options.stroke_width);

        groups.append("g")
            .selectAll("path")
            .data(_.flatten(data))
            .enter()
            .append("path")
            .attr("d" ,d3.svg.symbol().type(options.shape).size(options.size))
            .attr("fill", options.shape_fill)
            .attr("stroke", options.shape_stroke)
            .attr("stroke-width", options.shape_stroke_width)
            .attr("transform", function(d){return 'translate(' + d.x + ',' + d.y + ')';});
    };

    Connector.prototype.getLegend = function(){
        return;
    };

    Connector.prototype.checkSelectedData = function(ranges){
        return;
    };

    return Connector;
});
