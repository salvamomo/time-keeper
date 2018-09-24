const jshint = require('gulp-jshint');
const gulp   = require('gulp');
const replace = require('gulp-replace');
const process = require('process');
const { exec } = require('child_process');

gulp.task('jshint', function() {
  return gulp.src('./src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

/**
 * Build files for new releases.
 */
gulp.task('build', function() {

  // Requires nw-builder installed globally.
  let build_command = "nwbuild --version=\"0.33.3\" --buildDir=\"./build\" --platforms=\"osx64\",\"linux64\" --macIcns=\"./assets/osx/app.icns\" --flavor=\"normal\" ./";

  exec(build_command, { maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    else {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      console.log('Replacing Info.plist strings for OSX builds.');

      let plist_dir = './build/time-keeper/osx64/time-keeper.app/Contents';
      return gulp.src(plist_dir + '/*.plist')
        .pipe(replace('time-keeper', 'Time Keeper'))
        .pipe(gulp.dest(plist_dir));
    }
  });

});

gulp.task('default', ['jshint']);
