# vinyl-ftp-branch

Change the destination folder to the git branch name and use external account file for vinyl-ftp.

## Install

```
$ npm install gulp vinyl-ftp vinyl-ftp-branch --save-dev
```

## Define the task in gulpfile.js

options.finalRemotePath is the remotePath and your branch name. So, you can use like '/temp/test/BRANCHNAME'

```javascript
var gulp = require('gulp');
var vfb = require('vinyl-ftp-branch');
var ftp = require('vinyl-ftp');

gulp.task('ftp', function() {
    var options = vfb({
        host: 'REMOTE.HOST.LOCATION',
        port: '21',
        userKeyFile: '.ftppass',
        userKey: 'key1',
        remotePath: '/temp/test',
        log: false
    });
    var conn = ftp.create(options);

    return gulp.src(['src/**'], {buffer: false})
            .pipe(conn.newer(options.finalRemotePath))
            .pipe(conn.dest(options.finalRemotePath));
});

```

## Options

You can use options in [vinyl-ftp](https://www.npmjs.com/package/vinyl-ftp) and also additional options.

### userKeyFile
You can use the external file path of FTP account. Default is '.ftppass'.

The file contains follows:

```javascript
{
    "key1" : {
        "usename": "USERNAME",
        "password": "PASSWORD"
    },
    "key2" : {
        "usename": "USERNAME2",
        "password": "PASSWORD2"
    }
}
```

### userKey
The account key set in your userKeyFile. Default is 'key1'.

### remotePath
The remote path of a FTP server.

### log
See the log message.
