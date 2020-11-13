module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                stripBanners: true,
                banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */',
            },
            test: {
                files: {
                'builds/bfe-test.js' : ['src/lib/mini_require.js', 'src/bfe.js','src/bfestore.js','src/bfelogging.js','src/bfeusertemplates.js','src/bfeliterallang.js','src/bfelookups.js', 'src/bfelabels.js', 'src/bfeapi.js','src/lib/aceconfig.js'],
                'builds/bfe-test.css' : ['src/css/bootstrap-extra.css', 'src/css/typeahead.css', 'src/css/bfeusertemplates.css', 'src/css/bfeliterallang.css'],
                }
            },
            dist: {
                files: {
                'builds/bfe.js' : ['src/lib/mini_require.js', 'src/bfe.js','src/bfestore.js','src/bfelogging.js','src/bfeusertemplates.js','src/bfeliterallang.js','src/bfelookups.js', 'src/bfelabels.js', 'src/bfeapi.js','src/lib/aceconfig.js'], 
                'builds/bfe.css' : ['src/css/bootstrap-extra.css', 'src/css/typeahead.css', 'src/css/bfeusertemplates.css', 'src/css/bfeliterallang.css'],
                }
            },
        },
		uglify: {
			options: {
                stripBanners: true,
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
                 files: {
                      'builds/bfe.min.css': ['builds/bfe.css']
                 }
            }
         }
	});

	grunt.loadNpmTasks('grunt-contrib-uglify-es');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('default', ['concat:dist','uglify', 'cssmin']);
};
