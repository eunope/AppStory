'use strict';
/*
 * vinyl-ftp-branch
 * https://github.com/ch4feel/vinyl-ftp-branch
 *
 * Copyright (c) 2015 ch4feel
 * Licensed under the MIT license.
 */
var gutil = require('gulp-util');
var assign = require('object-assign');
var fs = require('fs');

module.exports = function (options) {
    options = assign({}, options);
    options.userKeyFile = options.userKeyFile || '.ftppass';
    options.userKey = options.userKey || 'key1';

    if(!fs.existsSync('.git/HEAD')) {
        throw new gutil.PluginError('vinyl-ftp-branch', 'Git repository required');
    }

    if(!fs.existsSync(options.userKeyFile)) {
        throw new gutil.PluginError('vinyl-ftp-branch', 'User key file not exists');
    }

    var ftppass = eval('['+fs.readFileSync(options.userKeyFile).toString().trim()+']')[0];
    var branchData = fs.readFileSync('.git/HEAD').toString().trim();
    var branchName = branchData.substring(branchData.lastIndexOf('refs/heads/') + 11);
    var remotePath = options.remotePath + '/' || '/';

    if(options.log == true)
        options.log = gutil.log;

    options.finalRemotePath = remotePath + branchName;

    if(eval('ftppass.' + options.userKey) == undefined) {
        throw new gutil.PluginError('vinyl-ftp-branch', 'User key not exists');
    }

    options.user = eval('ftppass.'+ options.userKey + '.username');
    options.pass = eval('ftppass.'+ options.userKey + '.password');

    delete options.userKey;
    delete options.userKeyFile;

    return options;
}
