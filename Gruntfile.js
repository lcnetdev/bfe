module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                stripBanners: true,
                banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */',
            },
            dist: {
                files: {
                'builds/bfe.js' : ['src/lib/mini_require.js', 'src/bfe.js','src/bfestore.js','src/bfelogging.js','src/bfeusertemplates.js','src/bfeliterallang.js','src/bfelookups.js', 'src/bfeapi.js','src/lib/aceconfig.js'], 
                'builds/bfe.css' : ['src/css/bootstrap.css', 'src/css/typeahead.css', 'src/css/bfeusertemplates.css', 'src/css/bfeliterallang.css'],
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
         },
         plato: {
            options: {
                     },
            tests: {
                files: {
                    'docs/plato': ['src/**/*.js', 'static/js/config*.js']
                    },
                   },
         },
	});

	grunt.loadNpmTasks('grunt-contrib-uglify-es');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-plato');

	grunt.registerTask('default', ['concat','uglify', 'cssmin', 'plato']);
};
