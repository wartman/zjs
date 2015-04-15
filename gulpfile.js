var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('build', function () {
  return gulp.src([
      './src/intro.js',
      './src/module.js',
      './src/loader.js',
      './src/z.js',
      './src/outro.js'
    ])
    .pipe(concat('z.js'))
    .pipe(gulp.dest('./lib/'));
});

gulp.task('default', ['build']);
