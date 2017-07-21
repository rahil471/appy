var gulp = require('gulp');
var lab = require('gulp-lab');
var tapColorize = require('tap-colorize');

gulp.task('test', function() {
    console.log(gulp.paths.src);
  return gulp.src([
    gulp.paths.src + 'test/**/*.spec.js'
  ])
  .pipe(lab());
});