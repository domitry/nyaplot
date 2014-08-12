define(['tools'], function(Tools){
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
            zoom_range:[0, 500],
            rotate_x_label:0,
            rotate_y_label:0,
            pane_uuid: null,
            z_index:0,
            extra: {}
        };

        var options_extra = {
            map_data: null,
            color: ["none"],
            text_color: '#fff',
            text_size: '1em',
            stroke_color: '#000'
        };

        if(arguments.length>2){
            _.extend(options, _options);
            _.extend(options_extra, _options.extra);
            options.extra = options_extra;
        }

        var fill_scale = d3.scale.ordinal().range(options.extra.color);
        var model = parent.append("g");
        var clip_id = "clip" + options.pane_uuid;

        model.append("clipPath")
            .attr("id", clip_id)
            .append("rect")
            .attr({
                "x": 0,
                "y": 0,
                "width": options.width,
                "height": options.height
            });

        model
            .attr("clip-path", "url(#" + clip_id + ")")
            .append("g").attr("class", "map")
            .style("z-index", options.z_index);

        var projection = d3.geo.mercator()
                .center([13, 35])
                .scale(1000);

        scales.init(projection);

        var path = d3.geo.path().projection(projection);

        var graticule = d3.geo.graticule();
        model.select(".map").append("path")
            .datum(graticule)
            .attr({
                "d": path,
                "stroke": "#fff",
                "stroke-width":2
            });
        var map = model.select(".map").selectAll("path")
                .data(options.extra.map_data.features)
                .enter()
                .append('path')
                .attr("d", path)
                .attr("stroke", options.extra.stroke_color)
                .attr("fill", function(d){return fill_scale(d.id);});

       if(options.zoom){
           parent.call(
               d3.behavior.zoom()
                   .scaleExtent(options.zoom_range)
                   .on("zoom", function(){
                       parent..select(".context_child").attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
                       model.select(".map").attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
                   })
           );
       }
    }
    return Axis;
});
