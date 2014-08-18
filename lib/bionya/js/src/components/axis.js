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
            zoom_range:[0.5, 5],
            rotate_x_label:0,
            rotate_y_label:0,
            pane_uuid: null,
            z_index:0,
            extra: {}
        };

        var options_extra = {
            df_id: null,
            inner_radius: 150,
            outer_radius: 170,
            group_by: null,
            fill_by: null,
            axis: null,
            chord: false,
            matrix: null,
            inner_num: 0,
            outer_num: 1,
            color: ['#253494'],
            text_color: '#fff',
            text_size: '1em'
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

        var fill_scale = (function(){
            if(options.extra.fill_by){
                var scale = df.scale(options.extra.fill_by, options.extra.color);
                var pairs = _.zip.apply(null, _.map(df.column(options.extra.fill_by), function(val, i){
                    return [i, scale(val)];
                }));
                return d3.scale.ordinal().domain(pairs[0]).range(pairs[1]);
            }else{
                return d3.scale.ordinal().range(options.extra.color);
            }
        })();

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

        var chord = d3.layout.chord().padding(.05).matrix(matrix);
        var model = parent.append("g").attr('transform', 'translate(' + options.width/2 + ',' + options.height/2 + ')');
        var clip_id = "clip" + options.pane_uuid;

        model.append("clipPath")
            .attr("id", clip_id)
            .append("rect")
            .attr({
                "x": -options.width/2,
                "y": -options.height/2,
                "width": options.width,
                "height": options.height
            });

        model
            .attr("clip-path", "url(#" + clip_id + ")")
            .style("z-index", options.z_index);

        var prefix = options.pane_uuid + "group";

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
            .attr("id", function(d, i){return prefix+i;});

        // labels for group arcs
        model.selectAll(".group_arcs")
            .append("text")
            .attr("x",6)
            .attr("dy",15)
            .append("textPath")
            .attr("xlink:href", function(d,i){return "#" + prefix + i;})
            .text(function(d,i){return groups[i];})
            .attr("fill", options.extra.text_color)
            .attr("font-size", options.extra.text_size);

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

        // dirty code. should be modified soon.
        if(options.zoom){
            parent.call(
                d3.behavior.zoom()
                    .scaleExtent(options.zoom_range)
                    .on("zoom", function(){
                        var translate = d3.event.translate;
                        var scale = d3.event.scale;
                        parent.select(".context_child").attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
                        translate[0] += (scale-1)*options.width/2;
                        translate[1] += (scale-1)*options.height/2;
                        model.select("g").attr('transform', 'translate(' + translate + ') scale(' + scale + ')');
                    }));
        }
    }

    return Axis;
});
