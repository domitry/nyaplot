if(window['d3'] === undefined ||
   window['Nyaplot'] === undefined){
    var path = {
	d3: 'http://d3js.org/d3.v3.min'
    };

    require.config({paths: path});

    require(['d3'], function(d3){
	window['d3'] = d3;
	console.log('Finished loading d3.js');

	var script = d3.select("head")
	    .append("script")
	    .attr("src", "https://rawgit.com/domitry/Nyaplotjs/master/release/nyaplot.js")
	    .attr("async", true);

	script[0][0].onload = function(){
	    var event = document.createEvent("HTMLEvents");
	    event.initEvent("load_nyaplot",false,false);
	    window.dispatchEvent(event);
	    console.log('Finished loading Nyaplotjs');
	};
    });
}
