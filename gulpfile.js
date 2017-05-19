'use strict';

// node modules
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const browserSync = require('browser-sync');
const vfb = require('vinyl-ftp-branch');
const ftp = require('vinyl-ftp');
const del = require('del');
const lazypipe = require('lazypipe');
const runSequence = require('run-sequence');

// gulp modules
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const handlebars = require('gulp-compile-handlebars');
const rename = require('gulp-rename');
const spritesmith = require('gulp.spritesmith');
const md5 = require('gulp-md5-plus');
const gulpif = require('gulp-if');
const plumber = require('gulp-plumber');
const cleanCSS = require('gulp-clean-css');
const uitIndex = require('gulp-nts-uit-index-helper');
const gulpSort = require('gulp-sort');

// notification
const notify = require("gulp-notify");

// postcss
const autoprefixer = require('autoprefixer');
const urlRebase = require('postcss-url');

var paths = {
	html_path: 'src',
	sprite_src: 'src/sprite/',
	sprite_dest: 'src/img/',
	css_src: 'src/scss/',
	css_dest: 'src/css/',
	img_dest: 'src/img/'
};

var config = {
	pc: true,
	browserSync: true,
	notify: true,
	urlRebase: false,
	urlRebaseOption: {
		basePath: paths.img_dest,
		defaultUrl: 'http://static.naver.com/',
		urlList: {
			'sprite/': 'http://static.naver.com/sp/',
		}
	},
	md5: false,
	uitIndex: false,
	uitIndexOption: {
		path: [path.join(paths.html_path,'*.html'),path.join(paths.html_path,'*.php')],
		options: {}
	}
}

function getFolders(dir) {
	return fs.readdirSync(dir)
		.filter(function (file) {
			return fs.statSync(path.join(dir, file)).isDirectory();
		});
};

var globalOptions = {
	notify: !config.notify ? {} : {
		errorHandler: notify.onError({
			title: '<%= error.relativePath %>',
			message: '<%= error.line %> line - <%= error.messageOriginal %>',
			sound: "Pop",
		})
	}
}

gulp.task('default', ['sass', 'sprite', 'watch', 'browserSync']);
gulp.task('dev', function() {
	runSequence(['sprite','uit_index'], 'sass');
});
gulp.task('build', ['sass-build','sprite']);

gulp.task('watch', function () {
	runSequence('sprite', 'sass');
	var options = {};
	gulp.watch([path.join(paths.css_src, '/**/*')], ['sass']);
	gulp.watch([path.join(paths.sprite_src, '/**/*')], ['sprite']);
});

gulp.task('sprite',['makeSprite','makeSpriteMap']);

gulp.task('makeSprite', function () {
	var stream_arr = [];
	var options = {
		spritesmith: function(folder) {
			return {
				imgPath: path.posix.relative(paths.css_dest, path.posix.join(paths.sprite_dest, 'sp_' + folder + '.png')),
				imgName: 'sp_' + folder + '.png',
				cssName: '_sp_' + folder + '.scss',
				cssFormat: 'scss',
				padding: 4,
				cssTemplate: './gulpconf/sprite_template.hbs',
				cssSpritesheetName: 'sp_' + folder,
			}
		},
	};

	getFolders(paths.sprite_src).map(function(folder) {
			var spriteData = gulp.src(path.join(paths.sprite_src, folder, '*.png'))
				.pipe(plumber(globalOptions.notify))
				.pipe(gulpSort())
				.pipe(spritesmith(options.spritesmith(folder)));
			stream_arr.push(new Promise(function(resolve) {
				spriteData.img
					.pipe(gulp.dest(paths.sprite_dest))
					.on('end',resolve);
			}));
			stream_arr.push(new Promise(function(resolve) {
				spriteData.css
					.pipe(gulp.dest(path.join(paths.css_src, 'sprite')))
					.on('end', resolve);
			}));
		});

	return Promise.all(stream_arr);
});

gulp.task('makeSpriteMap', ['makeSprite'], function() {
	var options = {
		maps: {
			handlebars: {
				prefix: 'sp_',
				path: path.posix.relative(path.posix.join(paths.css_src, 'import'),path.posix.join(paths.css_src, 'sprite')),
				import: getFolders(paths.sprite_src),
				ratio: config.pc ? 1 : 2,
			}
		},
	};

	return gulp.src('gulpconf/sprite_maps_template.hbs')
		.pipe(plumber(globalOptions.notify))
		.pipe(handlebars(options.maps.handlebars))
		.pipe(rename('_sprite_maps.scss'))
		.pipe(gulp.dest(path.join(paths.css_src, 'import')));
});

gulp.task('sass', function() {
	return gulp.src(path.join(paths.css_src, '**/*.scss'))
		.pipe(plumber(globalOptions.notify))
		.pipe(sourcemaps.init())
		.pipe(sassPipe())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.css_dest))
		.pipe(gulpif(config.browserSync, browserSync.stream({match:'**/*.css'})));
});

gulp.task('sass-build', ['sprite'], function() {
	return Promise.all([
		del(path.join(paths.css_dest,'**/*.css.map')),
		new Promise(function(resolve) {
			gulp.src(path.join(paths.css_src, '**/*.scss'))
				.pipe(plumber(globalOptions.notify))
				.pipe(sassPipe(true))
				.pipe(gulp.dest(paths.css_dest))
				.on('end',resolve);
		})
	]);
});

gulp.task('minify', [], function() {
	var options = {
		cleanCSS: {
			'advanced' : false,           // 속성 병합 false
			'aggressiveMerging': false,   // 속성 병합 false
			'restructuring': false,       // 선택자의 순서 변경 false
			'mediaMerging': false,        // media query 병합 false
			'compatibility': 'ie7,ie8,*', // IE 핵 남김
		}
	};
	return gulp.src(path.join(paths.css_dest, '*.css'))
		.pipe(cleanCSS(options.cleanCSS))
		.pipe(gulp.dest(paths.css_dest));
});

gulp.task('browserSync', function() {
	var options = {
		browserSync: {
			server: {
				baseDir: paths.html_path,
				directory: true
			},
			open: 'external',
		},
	};

	if(config.browserSync) {
		browserSync.init(options.browserSync);
		gulp.watch(paths.html_path+'/*.html').on('change',browserSync.reload);
	}
});

gulp.task('ftp', function() {
	var options = {
		ftp: {
			host: 'view.ui.naver.com',
			port: '2001',
			userKeyFile: '.ftppass', //[TODO].ftppass 처리 방법
			userKey: 'key1',
			parallel: 10, //병렬 전송 갯수 (기본값 3, 10이상 효과 미비)
			remotePath: '', //[TODO]각 서비스 업로드 경로 설정 필요
			log: true,
		},
		targetGlob: [path.join(paths.html_path,'**/*'), '!'+paths.sprite_src, '!'+path.join(paths.sprite_src, '**/*'), '!'+paths.css_src, '!'+path.join(paths.css_src, '**/*'), '!node_modules/'], // glob 문법으로 대상 지정
	};

	try {
		var chkFtppass = fs.accessSync('.ftppass', 'r'); // .ftppass 파일 존재 여부 확인
	} catch(e) {
		console.log('Not Exist .ftppass file. Please make .ftppass'); // .ftppass 파일이 없을 경우 에러
		return;
	}
	if(!options.ftp.remotePath || options.ftp.remotePath === '/') {  // remotePath 설정이 비어 있거나 '/'인지 확인.
		console.log('remotePath not set or set root');
		return;
	}

	var conn = ftp.create(vfb(options.ftp));

	return gulp.src(options.targetGlob, {buffer: false})
		.pipe(plumber(globalOptions.notify))
		.pipe(conn.newer(conn.config.finalRemotePath))
		.pipe(conn.dest(conn.config.finalRemotePath));
});

gulp.task('uit_index',function(){
	if(config.uitIndex) {
		return gulp.src(config.uitIndexOption.path) // 인덱스 대상 파일 선택
			.pipe(uitIndex(config.uitIndexOption.options))
			.pipe(gulp.dest('src/')); // 인덱스 저장 경로
	}
});

gulp.task('md5-sprite', ['makeSprite'], function() {
	var options = {
		md5: {
			cssSrc: path.join(paths.css_src,'sprite/*.scss'), //이름 변경 대상 css(scss) 파일
			srcDel: false, // sprite 이름 변경전 파일 삭제 여부
			logDel: true, // 이전 생성된 md5 sprite 삭제 여부
		}
	}

	if(config.md5) {
		var del_sprite = [];
		var sprite_list = getFolders(paths.sprite_src);
		for(var i=0,imax=sprite_list.length;i < imax;i++) {
			del_sprite.push(path.join(paths.sprite_dest,'sp_' + sprite_list[i] + '_????????.png'));
			sprite_list[i] = path.join(paths.sprite_dest,'sp_' + sprite_list[i] + '.png');
		}

		return del(del_sprite)
		.then(function() {
			return new Promise(function(resolve) {
				gulp.src(sprite_list)
					.pipe(plumber(globalOptions.notify))
					.pipe(md5(8,options.md5.cssSrc))
					.pipe(gulp.dest(paths.sprite_dest))
					.on('end',resolve);
			});
		}).then(function() {
			if(options.md5.srcDel) {
				return del(sprite_list);
			}
		});
	}
});

function sassPipe(build) {
	var options = {
		sass : {
			outputStyle: 'expanded',
			indentType: 'tab',
			indentWidth: 1
		},
		autoprefixer: {
			browsers: config.pc ?
						['last 2 versions', "Edge > 0", "ie >= 8"] : //PC옵션
						["Android > 0","iOS > 0","FirefoxAndroid > 0"] //모바일옵션
		}
	};

	options.postcss = [
		autoprefixer(options.autoprefixer),
	];

	if(build && config.urlRebase) {
		options.postcss.push(urlRebase({
			basePath: path.relative(paths.css_dest,config.urlRebaseOption.basePath),
			url: function (URL) {
				var rebasedUrl = URL;
				var basePath = path.posix.relative(paths.css_dest,config.urlRebaseOption.basePath);
				if(URL.indexOf(basePath) == 0) {
					rebasedUrl = config.urlRebaseOption.defaultUrl + path.posix.relative(basePath, URL);
				}
				for (var name in config.urlRebaseOption.urlList) {
					if (config.urlRebaseOption.urlList.hasOwnProperty(name)) {
						var basePath = path.posix.join(basePath, name);
						if(URL.indexOf(basePath) == 0) {
							rebasedUrl = config.urlRebaseOption.urlList[name] + path.posix.relative(basePath, URL);
						}
					}
				}
				return rebasedUrl;
			},
		}));
	}

	var returnPipe = lazypipe().pipe(sass,options.sass);
	if(build) {
		returnPipe = returnPipe.pipe(postcss,options.postcss);
	}

	return returnPipe();
}
