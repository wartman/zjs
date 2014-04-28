module.exports = function(grunt){

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
  
  grunt.loadNpmTasks('grunt-contrib-nodeunit')
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-qunit');

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
  grunt.registerTask('test', ['nodeunit', 'connect', 'qunit']);
  grunt.registerTask('default', ['test', 'distribute']);

}