if(window['d3'] === undefined ||
   window['Nyaplot'] === undefined){
    var paths = {
	d3: 'http://d3js.org/d3.v3.min',
	nyaplot: 'https://rawgit.com/domitry/Nyaplotjs/master/release/nyaplot'
    };

    require.config({paths: paths});

    require(['d3'], function(d3){
	window['d3'] = d3;
	console.log('Finished loading d3.js');
	require(['nyaplot'], function(Nyaplot){
	    window['Nyaplot'] = Nyaplot;
	    var event = document.createEvent("HTMLEvents");
	    event.initEvent("load_nyaplot",false,false);

	    console.log('Finished loading Nyaplotjs');
	    for(var key in paths){
		d3.select('head')
		    .append('script')
		    .attr('type', 'text/javascript')
		    .attr('src', paths[key] + '.js');
	    }
	    console.log(window['Nyaplot']);
	    window.dispatchEvent(event);
	});
    });
}
