"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass"); //scssコンパイル
const sassGlob = require("gulp-sass-glob");//sassをまとめてimport
const autoprefixer = require("gulp-autoprefixer"); //べンダープレフィックス
const notify = require("gulp-notify"); //エラーを通知
const plumber = require("gulp-plumber"); //watch中にエラー防止
const sourcemaps = require("gulp-sourcemaps"); //ソースマップ
const ejs = require("gulp-ejs"); //EJS
const rename = require("gulp-rename"); //リネーム
const replace = require("gulp-replace"); //置換
const browserSync = require("browser-sync"); //自動リロード
const del = require("del"); //削除
const imagemin = require("gulp-imagemin"); //画像圧縮
const changed = require("gulp-changed"); //変更のあったもの(画像)
const pngquant = require("imagemin-pngquant"); //png圧縮
const mozjpeg = require("imagemin-mozjpeg"); //jpg圧縮
const prettierPlugin = require("gulp-prettier-plugin"); //コードフォーマット
const webpackStream = require("webpack-stream"); //webpack-stream
const webpack = require("webpack"); //webpack
const webpackConfig = require("./webpack.config"); //webpack.configファイル

// paths
const paths = {
  src: "src",
  dist: "dist"
};

//scssコンパイル
gulp.task("sass", () => {
  return gulp
    .src(paths.src + "/scss/**/*.scss")
    .pipe(sassGlob())
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'expanded'}))
    .pipe(
      autoprefixer({
        grid: true
      })
    )
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(paths.dist + "/assets/css"));
  //   .pipe(notify({
  //     title: "Sassをコンパイルしました。",
  //     message: new Date(),
  //     sound: "Tink",
  // }))
});

//EJS
gulp.task("ejs", () => {
  return gulp
    .src([paths.src + "/ejs/**/*.ejs", "!" + paths.src + "/ejs/**/_*.ejs"])
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ejs({}, {}, { ext: ".html" }))
    .pipe(rename({ extname: ".html" }))
    .pipe(replace(/[\s\S]*?(<!DOCTYPE)/, "$1"))
    .pipe(gulp.dest(paths.dist));
  //   .pipe(notify({
  //     title: "EJSをコンパイルしました。",
  //     message: new Date(),
  //     sound: "Tink",
  // }))
});

//images
var imgPaths = {
  srcDir: paths.src + "/images",
  dstDir: paths.dist + "/assets/images"
};
gulp.task("imagemin", () => {
  var srcGlob = imgPaths.srcDir + "/**/*.+(jpg|jpeg|png|gif|svg)";
  var dstGlob = imgPaths.dstDir;
  return gulp
    .src(srcGlob)
    .pipe(changed(dstGlob))
    .pipe(
      imagemin([
        pngquant({ quality: "65-80", speed: 1 }),
        mozjpeg({ quality: 80 }),
        imagemin.svgo(),
        imagemin.gifsicle()
      ])
    )
    .pipe(gulp.dest(dstGlob))
    .pipe(
      notify({
        title: "img作成",
        message: new Date(),
        sound: "Tink"
      })
    );
});

// server
gulp.task("browser-sync", () => {
  return browserSync.init({
    server: {
      baseDir: paths.dist
    },
    startPath: "./",
    port: 4000,
    notify: false,
    open: "external",
    reloadOnRestart: true
  });
});

// webpack
gulp.task("webpack", () => {
  return webpackStream(webpackConfig, webpack).pipe(
    gulp.dest(paths.dist + "/assets/js")
  );
});

// コードフォーマット
gulp.task("prettier", () => {
  return gulp
    .src([paths.src + "/scss/**/*.scss", paths.src + "/js/**/*.js",paths.dist + "/assets/**/*.html"])
    .pipe(prettierPlugin(undefined, { filter: true }))
    .pipe(gulp.dest(file => file.base));
});

// reload
gulp.task("reload", done => {
  browserSync.reload();
  done();
});

// clean
gulp.task("clean", done => {
  del(paths.dist + "/**/*");
  done();
});

// watch
gulp.task("watch", done => {
  gulp.watch(
    paths.src + "/scss/**/*.scss",
    gulp.series("sass", "ejs", "prettier", "reload")
  );
  gulp.watch(
    paths.src + "/js/**/*.js",
    gulp.series("webpack", "prettier", "reload")
  );
  gulp.watch(paths.src + "/ejs/**/*.ejs", gulp.series("ejs", "reload"));
  done();
});

// gulp
gulp.task("default", gulp.parallel("watch", "browser-sync"));

// build
gulp.task("build",
    gulp.series("clean",
        gulp.series("imagemin",
            gulp.series("sass",
                gulp.series("webpack",
                    gulp.series("ejs",
                      gulp.series("prettier"))))))
);