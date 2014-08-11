module.exports = function(grunt){
    grunt.initConfig({
        requirejs: {
            options: {
                baseUrl: 'src',
                name: './contrib/almond/almond',
		        include: ['main'],
                wrap: {
                    startFile: 'src/wrap/start.js',
                    endFile: 'src/wrap/end.js'
                }
	    },
            production: {
                options: {
		            optimizeAllPluginResources: true,
		            optimize: 'uglify2',
		            out: "release/bionya.min.js"
		        }
	        },
            development: {
		        options: {
                    optimize: "none",
                    out: "release/bionya.js"
		        }
	        }
	    }
    });
    
    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.registerTask("default", ["release"]);
    grunt.registerTask("debug", ["requirejs:development"]);
    grunt.registerTask("release", ["requirejs"]);
};
