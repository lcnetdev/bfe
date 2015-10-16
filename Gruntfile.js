module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */',
			},
			dist: {
				files: [
					{src: 'builds/bfe.js', dest: 'builds/bfe.min.js'}
				]
			},
		},
        cssmin: {
            add_banner: {
                 options: {
                     banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */'
                 },
            },
            combine: {
                 //For some reason, this one is dest then src
                 files: {
                      'builds/bfe.min.css': ['builds/bfe.css']
                 }
            }
         }
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	grunt.registerTask('default', ['uglify', 'cssmin']);
};
