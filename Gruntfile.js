module.exports = function(grunt){

  // The makefile for zjs
  var make = grunt.file.readJSON( __dirname + '/make.json');

  function process( code ) {
    return "\n\n" + code
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
        src: make.base,
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
    // qunit: {
    //   options: {
    //     timeout: 10000
    //   },
    //   all:[
    //     'test/**/*-grunt.html'
    //   ]
    // },
    // connect: {
    //   server: {
    //     options: {
    //       port: 8080
    //     }
    //   }
    // }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['connect', 'qunit'] );
  grunt.registerTask('default', ['concat']);
  grunt.registerTask('build', ['concat'] );
  grunt.registerTask('build-min', ['concat', 'uglify'] );

}