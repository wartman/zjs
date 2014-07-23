var gulp = require('gulp');
var concat = require('gulp-concat');
var mocha = require('gulp-mocha');
var mochaPhantomJs = require('gulp-mocha-phantomjs');
var replace = require('gulp-replace');

gulp.task('build', function() {
  var meta = require('./package.json');

  gulp.src([
      './src/intro.js',
      './src/helpers.js',
      './src/wait.js',
      './src/api.js',
      './src/plugins.js',
      './src/parser.js',
      './src/loader.js',
      './src/start.js',
      './src/outro.js',
    ])
    .pipe(concat('z.js'))
    .pipe(replace(/@VERSION/g, meta.version))
    .pipe(replace(/@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" )) )
    .pipe(gulp.dest('./dist/'));

  gulp.src([
      './src/intro.js',
      './src/api.js',
      './src/outro.js',
    ])
    .pipe(concat('z.runtime.js'))
    .pipe(replace(/@VERSION/g, meta.version))
    .pipe(replace(/@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" )) )
    .pipe(gulp.dest('./dist/'));
});

gulp.task('mochaPhantomJs', function () {
  return gulp.src('./tests/runner.html')
    .pipe(mochaPhantomJs({reporter: 'spec'}));
});

gulp.task('mocha', function () {
  return gulp.src('./tests/server_test.js')
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('default', ['build', 'mocha', 'mochaPhantomJs']);