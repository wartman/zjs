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
    concat: {
      dist: {
        options: { process: process },
        src: [
          "src/intro.js",
          "src/util_large.js",
          // "src/util_small.js",
          "src/core.js",
          "src/Class.js",
          "src/Module.js",
          "src/Loader.js",
          "src/Script.js",
          "src/Ajax.js",
          "src/amd.js",
          "src/plugins.js",
          "src/outro.js"
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
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('test', ['connect', 'qunit'] );
  grunt.registerTask('default', ['concat']);
  grunt.registerTask('build', ['concat'] );
  grunt.registerTask('build-min', ['concat', 'uglify'] );

}