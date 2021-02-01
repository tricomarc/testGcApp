/*
 * Dependencias
 */
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');
var prompt = require('gulp-prompt');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');
var dateFormat = require('dateformat');
var exec = require('child_process').exec;
var fs = require('fs');

var shell = require('./shellHelper');

var now = new Date();

var project = '';
var env = '';
var configPath = '';
var configXmlPath = '';
var resourcesFolder = '';
var iconResourcePath = '';
var splashResourcePath = '';
var skinsPath = '';
var cssFilePath = '';
var firebaseAndroidPath = '';
var firebaseIosPath = '';

var projectArray = [
    'demo', // 1
    'cruzverde', // 2
    'corona', // 3
    'ripley', // 4
    'maicao', // 5
    'colgram', // 6
    'etafashion', // 7
    'hites', // 8
    'fashionpark', // 9
    'familyshop', // 10
    'eligeperu', // 11
    'downlight', // 12
    'stand', // 13
    'wados', // 14
    'oxxo', // 15
    'paris', // 16
    'pu', // 17
    'modella', // 18
    'block', // 19
    'fcvcolombia', // 20
    'bancoripley', // 21
    'informat', // 22
    'lounge', // 23
    'multimax', // 24
    'tommy', // 25
    'grupolosrobles', // 26
    'gcsales', // 27
    'olimpica', // 28
    'niusushi', // 29
    'zoom', // 30
    'g&t', // 31
    'casinos', // 32
    'newcolgramperu', // 33
    'seleccionabcdin', // 34
    'visualstaff', // 35
    'pfalimentos', // 36
    'miniso', // 37
    'barcelo', // 38
    'johnson', // 39
    'casaideas', // 40
    'sensacion', //41
    'martina', //42
    'megasuper', //43
    'cruzverdeecuador', //44
    'serfinanza', // 45
    'grupojulio', // 46
    'oxxogas', // 47
    'oxxomexico', // 48
    'viauno' // 49
];

var envArray = [
    'dv',
    'st',
    'pr'
];

gulp.task('sign-app-full', function (callback) {
    runSequence(
        'questions',
        'clean',
        'ionic-resources-icon',
        'ionic-resources-splash',
        'skins',
        'styles',
        'config',
        'xlmconfig',
        'chmod',
        'add-android-platform',
        'icons',
        'create-resources',
        'ic_notification',
        'add-plugins',
        'ionic-pro',
        'build-app-release',
        'sign-app',
        callback
    );

    /*runSequence(
        'build-app-release',
        'sign-app',
        callback
    );*/
    gutil.log('Gulp Completo');
});

gulp.task('change-env', function (callback) {
    runSequence(
        'questions',
        'clean2',
        'ionic-resources-icon',
        'ionic-resources-splash',
        'skins',
        'styles',
        'firebaseAndroid', 
        'firebaseIos',
        'config',
        'xlmconfig',
        'chmod',
        'icons',
        'create-resources',
        'ic_notification',
        'add-plugins',
        'ionic-pro',
        // 'build-app',
        callback
    );
    gutil.log('Gulp Completo');
});

/**
 * Función default se ejecuta una vez que todas las funciones han finalizado
 */
gulp.task('default', ['add-plugins'], function () {
    gutil.log('Gulp Completo');
});

/**
 * Seleccion de entorno y proyecto
 */
gulp.task('questions', function (done) {
    gulp.src('')
        .pipe(prompt.prompt([{
            type: 'rawlist',
            name: 'env',
            message: 'Which environment would you like to use?',
            choices: envArray
        }, {
            type: 'rawlist',
            name: 'project',
            message: 'Which project would you like to use?',
            choices: projectArray
        }], function (res) {
            if (!res.env.length) {
                throw Error("Missed env parameter");
                process.exit();
            }
            if (!res.project.length) {
                throw Error("Missed project parameter");
                process.exit();
            }
            project = res.project;
            env = res.env;
            configPath = './assets/env/' + project + '/' + env + '.ts';
            configXmlPath = './assets/env/' + project + '/config.xml';
            iconResourcePath = './assets/env/' + project + '/resources/icon.png';
            splashResourcePath = './assets/env/' + project + '/resources/splash.png';
            resourcesFolder = './assets/env/' + project + '/resources/iconos/';
            skinsPath = './assets/skins/' + project + '/img/';
            cssFilePath = './assets/env/' + project + '/main-theme.scss';
            firebaseAndroidPath = './assets/env/' + project + '/google-services.json';
            firebaseIosPath = './assets/env/' + project + '/GoogleService-Info.plist';
        }))
        .on('end', done);
});
/**
 * Elimina carpeta y archivos para generar nuevos
 */
gulp.task('clean', function (done) {
    return gulp.src([
        './resources/*',
        './platforms',
        './res',
        './plugins'
    ])
        .pipe(clean({
            force: true
        }))
    done();
});

gulp.task('clean2', function (done) {
    return gulp.src([
        './resources/*',
        './src/assets/img'
    ])
        .pipe(clean({
            force: true
        }))
    done();
});


/**
 * Actualización de icono de App
 */
gulp.task('ionic-resources-icon', function (done) {
    if (!fileExists(iconResourcePath)) {
        throw Error("Path not found -> Icon");
        process.exit();
    }

    gulp.src(iconResourcePath)
        .pipe(gulp.dest('./resources/'))
        .on('end', done);
});

/**
 * Actualización de splash de App
 */
gulp.task('ionic-resources-splash', function (done) {
    if (!fileExists(splashResourcePath)) {
        throw Error("Path not found -> Splash");
        process.exit();
    }

    gulp.src(splashResourcePath)
        .pipe(gulp.dest('./resources/'))
        .on('end', done);
});

/**
 * Actualización de imágenes de App
 */
gulp.task('icons', function (done) {
    if (!folderExists(resourcesFolder)) {
        gutil.log('resourcesFolder', resourcesFolder, project);
        throw Error("Path not found -> resourcesFolder");
        process.exit();
    }

    gulp.src(resourcesFolder + '**')
        .pipe(gulp.dest('./resources/android/icon'))
        .on('end', done);
});

/**
 * Actualización de imágenes de App
 */
gulp.task('skins', function (done) {
    if (!folderExists(skinsPath)) {
        gutil.log('skinsPath', skinsPath, project);
        throw Error("Path not found -> skins");
        process.exit();
    }

    gulp.src(skinsPath + '**')
        .pipe(gulp.dest('./src/assets/img'))
        .on('end', done);
});

/**
 * Actualización de estilos de App
 */
gulp.task('styles', function (done) {
    if (!fileExists(cssFilePath)) {
        gutil.log('cssFilePath', cssFilePath, project);
        throw Error("Path not found -> styles");
        process.exit();
    }

    gulp.src(cssFilePath)
        .pipe(gulp.dest('./src/theme/'))
        .on('end', done);
});

// Trae el sdk de android
gulp.task('firebaseAndroid', function (done) {
    if (fileExists(firebaseAndroidPath)) {
        gulp.src(firebaseAndroidPath)
            .pipe(gulp.dest('./'))
            .on('end', done);
    } else {
        done();
    }
});


// Trae el sdk de IOS
gulp.task('firebaseIos', function (done) {
    if (fileExists(firebaseIosPath)) {
        gulp.src(firebaseIosPath)
            .pipe(gulp.dest('./'))
            .on('end', done);
    } else {
        done();
    }
});

/**
 * Configuración automática de rutas y variable globales según selección
 */
gulp.task('config', function (done) {
    if (!fileExists(configPath)) {
        throw Error("Path not found");
        process.exit();
    }

    gulp.src(configPath)
        .pipe(rename('global.ts'))
        .pipe(gulp.dest('./src/shared/config'))
        .on('end', done);
});

/**
 * Actualización de configuración de App
 */
gulp.task('xlmconfig', function (done) {
    if (!fileExists(configXmlPath)) {
        throw Error("Path not found");
        process.exit();
    }

    gulp.src(configXmlPath)
        .pipe(gulp.dest('./'))
        .on('end', done);
});

/**
 * Permisos de lectura y escritura para nuevo config.xml
 */
gulp.task('chmod', function (done) {
    var plugins = exec('chmod -R 777 config.xml', {
        cwd: './'
    }, function (err, stdout, stderr) {
        done();
    });

    plugins.stdout.on('data', function (data) {
        console.log(' --> ', data);
    });
})

/**
 * Crea plataforma Android
 */
gulp.task('add-android-platform', function (done) {
    var platform = exec('ionic cordova platform add android', {
        cwd: './'
    }, function (err, stdout, stderr) {
        done();
    });

    platform.stdout.on('data', function (data) {
        console.log(' --> ', data);
    });
})

/**
 * Actualización de recursos de App
 */
gulp.task('create-resources', function (done) {
    shell.exec(process.platform === 'win32' ? 'cordova-res.cmd' : 'npm run resources', function (err) {
        console.log('ionic cordova resources err ', err);
        done();
    });
});

/**
 * Instalación de plugins cordova
 */
gulp.task('add-plugins', function (done) {
    var plugins = exec('ionic cordova prepare', {
        cwd: './'
    }, function (err, stdout, stderr) {
        done();
    });

    plugins.stdout.on('data', function (data) {
        console.log(' --> ', data);
    });
});

/**
 * Genera apk para android
 */
gulp.task('build-app', function (done) {
    exec('ionic cordova build android', {
        cwd: './'
    }, function (err, stdout, stderr) {
        //done();
    }).on('end', function () {
        gutil.log('Build finalizado.');
        done();
    });
});
/**
 * Genera apk para android en release
 */
//gulp.task('build-app', ['add-plugins'], function (done) {
gulp.task('build-app-release', function (done) {
    exec('ionic cordova build android --release', {
        cwd: './'
    }, function (err, stdout, stderr) {
        //console.log(1, err, stderr);

        if (!fileExists('./platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk')) {
            throw Error("Path not found");
            process.exit();
        }

        gulp.src('./platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk')
            .pipe(gulp.dest('./release'))
            .on('end', function () {
                gutil.log('Build finalizado.');
                done();
            });
    });
});

/**
 * Firma Apk para subir a play store
 */
gulp.task('sign-app', function (done) {
    gulp.src('')
        .pipe(prompt.prompt([{
            type: 'password',
            name: 'pass',
            message: 'Please enter your password'
        }, {
            type: 'input',
            name: 'version',
            message: 'Please enter the version'
        }],
            function (res) {

                if (!res.pass.length) {
                    throw Error("Missed pass parameter");
                    process.exit();
                }
                if (!res.version.length) {
                    throw Error("Missed version parameter");
                    process.exit();
                }

                exec('jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore visual.keystore -storepass ' + res.pass + ' app-release-unsigned.apk visual', {
                    cwd: './release'
                }, function (err, stdout, stderr) {
                    console.log(1, err, stderr);
                    gutil.log('jarsigner finalizado.');

                    //TODO: cambiar según dispositivo
                    exec('/Users/sebastiandelvillar/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 app-release-unsigned.apk clientegc-version.apk', {
                        cwd: './release'
                    }, function (err, stdout, stderr) {
                        console.log(2, err, stderr);
                        gutil.log('zipalign finalizado.');

                        gulp.src('./release/clientegc-version.apk')
                            .pipe(rename('gc-app-' + env + '-' + project + '-v' + res.version + '-' + dateFormat(now, "isoDate") + '.apk'))
                            .pipe(gulp.dest('./release'))
                            .on('end', function () {
                                gutil.log('APK lista y firmada');
                                gulp.src(['./release/clientegc-version.apk', './release/app-release-unsigned.apk'])
                                    .pipe(clean({
                                        force: true
                                    }));
                                //done();
                            });
                    });
                });
            }))
        .on('end', done);
});


gulp.task('copy-files', function () {
    var json = JSON.parse(fs.readFileSync('./assets/env/' + project + '/pro.json'));
    gulp.src('./')
        .pipe(exec('ionic link --pro-id ' + json.pro.appId));
});
/**
 * Cambia git por el asignado al cliente
 */
gulp.task('ionic-pro', function (done) {
    var json = JSON.parse(fs.readFileSync('./assets/env/' + project + '/pro.json'));

    shell.exec('ionic link --pro-id ' + json.pro.appId, function (err) {
        done();
    });
});

gulp.task('ic_notification', function () {
    gulp.src('./resources/android/icon/ic_notification/**')
        .pipe(gulp.dest('./platforms/android/app/src/main/res'));
});

/**
 * Levanta app en browser
 */
gulp.task('ionic-serve', function (done) {
    exec('ionic serve --lab', {
        cwd: './'
    }, function (err, stdout, stderr) {
        gutil.log('Build finalizado.', err, stdout, stderr);
        done();
    });
});


function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

function folderExists(folderPath) {
    try {
        var stat = fs.statSync(folderPath);
        return stat && stat.isDirectory();
    } catch (e) {
        return false;
    }
}
