const jshint = require('gulp-jshint');
const gulp   = require('gulp');

gulp.task('jshint', function() {
  return gulp.src('./src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', ['jshint']);
