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
            df_id: null,
            map_data: null,
            cca3: null,
            fill_by: null,
            color: ["none"],
            text_color: '#fff',
            text_size: '1em',
            stroke_color: '#000',
            no_data_color: 'none',
            center: [13, 35],
            scale: 1000
        };

        if(arguments.length>2){
            _.extend(options, _options);
            _.extend(options_extra, _options.extra);
            options.extra = options_extra;
        }

        var fill_scale = (function(){
            var country_id = _.map(options.extra.map_data.features, function(d){return d.properties.iso_a3;});

            if(_.every(country_id, function(id){return typeof id == "undefined";})){
                return d3.scale.ordinal().range(options.extra.color);
            }

            if(options.extra.fill_by != null){
                var df = Manager.getData(options.extra.df_id);
                var scale = df.scale(options.extra.fill_by, options.extra.color);
                var fill_by_column = df.column(options.extra.fill_by);
                var id_column = df.column(options.extra.cca3);
                return d3.scale.ordinal()
                    .domain(country_id)
                    .range(_.map(country_id, function(id, i){
                        var pos = id_column.indexOf(id);
                        if(pos != -1)return scale(fill_by_column[pos]);
                        else return options.extra.no_data_color;
                    }));
            }else{
                return d3.scale.ordinal()
                    .domain(country_id)
                    .range(options.extra.color);
            }
        })();

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
                .center(options.extra.center)
                .scale(options.extra.scale);

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
                .attr("fill", function(d){
                    if(typeof d.properties.iso_a3 == "undefined")return options.extra.no_data_color;
                    else return fill_scale(d.properties.iso_a3);
                });

       if(options.zoom){
           parent.call(
               d3.behavior.zoom()
                   .scaleExtent(options.zoom_range)
                   .on("zoom", function(){
                       var translate = d3.event.translate;
                       var scale = d3.event.scale;
                       scales.setTranslate(translate[0], translate[1]);
                       scales.setScale(scale);
                       parent.select(".context_child").attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
                       model.select(".map").attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
                   })
           );
       }
    }
    return Axis;
});
