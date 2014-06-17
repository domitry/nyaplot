if(window['d3'] === undefined ||
   window['Ecoli'] === undefined){
    var paths = {
	d3: 'http://d3js.org/d3.v3.min',
	ecoli: 'https://rawgit.com/domitry/Ecolijs/master/release/ecoli'
    };

    require.config({paths: paths});

    require(['d3'], function(d3){
	window['d3'] = d3;
	console.log('Finished loading d3.js');
	require(['ecoli'], function(Ecoli){
	    window['Ecoli'] = Ecoli;
	    console.log('Finished loading Ecolijs');
	    for(var key in paths){
		d3.select('head')
		    .append('script')
		    .attr('type', 'text/javascript')
		    .attr('src', paths[key] + '.js');
	    }
	});
    });
}
