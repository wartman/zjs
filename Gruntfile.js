module.exports = function(grunt){

  function process( code ) {
    return "\n\n" + code
      // Embed version
      .replace( /@VERSION/g, grunt.config( "pkg" ).version )
      // Embed date (yyyy-mm-ddThh:mmZ)
      .replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      main: {
        src: 'z.js',
        dest: 'dist/z.js',
        options: {
          process: process
        }
      },
    },
    uglify: {
      z: {
        options: {
          banner: '/*! z | <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: 'z.js',
        dest: 'dist/z-min.js'
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/build/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['mochaTest', 'copy', 'uglify']);
  grunt.registerTask('test', 'mochaTest');

}