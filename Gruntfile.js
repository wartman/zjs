module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        options: {
          // Replace all 'use strict' statements in the code with a single one at the top
          banner: "'use strict';\n",
          process: function(src, filepath) {
           return src
            // Embed version
            .replace( /@VERSION/g, grunt.config( "pkg" ).version )
            // Embed date (yyyy-mm-ddThh:mmZ)
            .replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );
          },
        },
        files: {
          'z.js': 'src/z.js'
        },
      },
    },
    simplemocha: {
      options: {
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: true,
        ui: 'bdd',
        reporter: 'spec'
      },
      all: { src: ['tests/server_test.js'] }
    },
    mocha_phantomjs: {
      all: {
        options: {
          urls: [
            'http://localhost:8000/tests/runner.html'
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
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('test', ['simplemocha', 'connect', 'mocha_phantomjs']);
  grunt.registerTask('default', ['test', 'concat']);

}