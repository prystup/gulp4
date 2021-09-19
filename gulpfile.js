const { src, dest, watch, parallel, series, gulp } = require('gulp'),
  sass = require('gulp-sass')(require('sass')),
  notify = require('gulp-notify'),
  sourcemaps = require('gulp-sourcemaps'),
  autoprefixer = require('gulp-autoprefixer'),
  rename = require('gulp-rename'),
  cleanCss = require('gulp-clean-css'),
  fileinclude = require('gulp-file-include'),
  imagemin = require('gulp-imagemin'),
  svgSprite = require('gulp-svg-sprite'),
  ttf2woff2 = require('gulp-ttf2woff2'),
  del = require('del'),
  webpackStream = require('webpack-stream'),
  uglify = require('gulp-uglify-es').default,
  browserSync = require('browser-sync');

//=========== Gulp Tasks ============//

//***********  SCSS to CSS **********/
const styles = () => {
  return src('./src/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'expanded',
      }).on('error', notify.onError())
    )
    .pipe(
      rename({
        suffix: '.min',
      })
    )
    .pipe(autoprefixer(['last 10 version']))
    .pipe(
      cleanCss({
        level: 2,
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/css/'))
    .pipe(browserSync.stream());
};

//*********** HTML include  **********/
const htmlInclude = () => {
  return src('./src/index.html')
    .pipe(
      fileinclude({
        prefix: '@@',
        basepath: '@file',
      })
    )
    .pipe(dest('./app'))
    .pipe(browserSync.stream());
};

//*********** Scripts  **********/
const scripts = () => {
  return src('./src/js/main.js')
    .pipe(
      webpackStream({
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [['@babel/preset-env', { targets: 'defaults' }]],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(sourcemaps.init())
    .pipe(uglify().on('error', notify.onError()))
    .pipe(sourcemaps.write())
    .pipe(
      rename({
        suffix: '.min',
      })
    )
    .pipe(dest('./app/js'))
    .pipe(browserSync.stream());
};

//***********  Minimize Images **********/
const images = () => {
  return src(['src/img/**.jpg', 'src/img/**.png', 'src/img/**.jpeg'])
    .pipe(imagemin())
    .pipe(dest('app/img'));
};

//*********** SVG **********/
const svgSprites = () => {
  return src('./src/img/svg/*.svg')
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg',
          },
        },
      })
    )
    .pipe(dest('app/img/svg'));

  /* Example:
   <svg class="">
      <use xlink:href="img/svg/sprite.svg#(svg name)"></use>
    </svg> */
};

//*********** Resources folder **********/
const resources = () => {
  return src('./resources/**').pipe(dest('./app'));
};

//*********** Fonts converter **********/
const fonts = () => {
  return src('./src/fonts/**.ttf').pipe(ttf2woff2()).pipe(dest('app/fonts'));
};

//*********** Cleaning app/ **********/
const clean = () => {
  return del(['app/*']);
};

//***********  Watch Files **********/
const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: './app',
    },
  });

  watch('src/scss/**/**.scss', styles);
  watch('src/index.html', htmlInclude);
  watch('src/img/**.jpg', images);
  watch('src/img/**.png', images);
  watch('src/img/**.jpeg', images);
  watch('src/img/svg/*.svg', svgSprites);
  watch('src/recouces/**', resources);
  watch('src/fonts/**.ttf', fonts);
  watch('src/js/**/*.js', scripts);
};

//=========== Exports Tasks ============//
exports.styles = styles;
exports.htmlInclude = htmlInclude;
exports.images = images;
exports.svgSprites = svgSprites;
exports.watchFiles = watchFiles;
exports.fonts = fonts;

// Default
exports.default = series(
  clean,
  parallel(htmlInclude, scripts, fonts, images, svgSprites, resources),
  styles,
  watchFiles
);

// Build
const stylesBuild = () => {
  return src('./src/scss/**/*.scss')
    .pipe(
      sass({
        outputStyle: 'expanded',
      }).on('error', notify.onError())
    )
    .pipe(
      rename({
        suffix: '.min',
      })
    )
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(
      cleanCss({
        level: 2,
      })
    )
    .pipe(dest('./app/css/'));
};

const scriptsBuild = () => {
  return src('./src/js/main.js')
    .pipe(
      webpackStream({
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [
            {
              test: /\.m?js$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [['@babel/preset-env', { targets: 'defaults' }]],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(uglify().on('error', notify.onError()))
    .pipe(
      rename({
        suffix: '.min',
      })
    )
    .pipe(dest('./app/js'));
};

exports.build = series(
  clean,
  parallel(htmlInclude, scriptsBuild, fonts, images, svgSprites, resources),
  stylesBuild
);
