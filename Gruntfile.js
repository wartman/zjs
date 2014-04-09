module.exports = function(grunt){

  function process( code ) {
    return code
      // Embed version
      .replace( /@VERSION/g, grunt.config( "pkg" ).version )
      // Embed date (yyyy-mm-ddThh:mmZ)
      .replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        options: { process: process },
        src: [
          'src/intro.js',
          'src/core.js',
          'src/outro.js'
        ],
        dest: "dist/z.js"
      },
    },
    uglify: {
      z: {
        options: {
          banner: '/*! z | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: 'dist/z.js',
        dest: 'dist/z-min.js'
      }
    },
    // Unit tests.
    nodeunit: {
      tests: [
        'test/build_test.js',
        'test/sorter_test.js'
      ],
    },
    qunit: {
      all: {
        options: {
          urls: [
            'http://localhost:8000/test/test-runner.html'
          ]
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8000,
          base: '.'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-nodeunit')
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  grunt.registerTask('test', ['nodeunit', 'connect', 'qunit']);
  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('default', ['build', 'test']);

}