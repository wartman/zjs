module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      tests: [
        'test/build_test.js',
        'test/sorter_test.js'
      ],
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
  
  grunt.loadNpmTasks('grunt-contrib-nodeunit')
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('distribute', function () {
    var code = grunt.file.read(__dirname + '/src/z.js');
    var dest = __dirname + '/z.js';
    code = code
      // Embed version
      .replace( /@VERSION/g, grunt.config( "pkg" ).version )
      // Embed date (yyyy-mm-ddThh:mmZ)
      .replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );
    if(grunt.file.exists(dest)){
      grunt.file.delete(dest);
    }
    grunt.file.write(dest, code);
  });
  grunt.registerTask('test', ['simplemocha', 'connect', 'mocha_phantomjs']);
  // grunt.registerTask('test', ['connect', 'mocha_phantomjs']);
  grunt.registerTask('default', ['test', 'distribute']);

}