const gulp = require('gulp');
const eslint = require('gulp-eslint');
const tape = require('gulp-tape')

gulp.task('default', function() {
  return gulp.src('lib/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('test', function() {
  return gulp.src('test/*_spec.js')
    .pipe(tape({
      bail: true
    }));
});
