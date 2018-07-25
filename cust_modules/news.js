var express = require("express");
var authenticate = require("./authenticate");
var newsql = require("./newsql");
var uuid = require('uuid/v4');
var frm = require('formidable');
var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
var router = express.Router();
var auth = {};
router.use((req, res, next) => {
    if (req.cookies.auth) {
        authenticate.checkToken(req.cookies.auth).then (resolve => {
            auth.auth = resolve.auth;
            auth.user = resolve.pid;
            auth.userlevel = resolve.userlevel;
            res.cookie('auth', resolve.cookie);
            next();
        }, reason => {
            auth.auth = false;
            auth.userlevel = 0;
            res.cookie('auth', null);
            next();
        }).catch(err => {
            console.log('Authedd.catch', err);
        })
    } else {
        auth.auth = false;
        auth.userlevel = 0;
        next();
    }
});

//GET requests

router.get('/', (req, res) => {
    if(req.query.pid) {
        console.log(req.query.pid);
        newsql.getList({
            pid : req.query.pid
        })
        .then(resolved => {
            console.log(resolved);
            res.render('newspost', {
                title: 'News',
                auth: auth,
                news : resolved[0]
            }) 
        }, reason => {
            res.render('404', {
                title: '404 Error',
                auth: auth
            })
        }).catch(err => {
            res.render('500', {
                title: '500 Server Error',
                auth: auth,
                error: err
            })
        })
    } else {
        newsql.getList({
            active: 1
        })
        .then(resolved => {
                res.render('news', {
                    title : 'News',
                    auth : auth,
                    news : resolved
                })
            }, reason => {
                res.render('500', {
                    title : '500 Server Error',
                    auth : auth,
                    error : reason
                })
            }).catch(err => {
            console.log(err)
            res.render('500', {
                title : '500 Server Error',
                auth : auth,
                error : err
            })
        })
    }
})

router.get('/add', (req, res) => {
    if (!auth.auth || auth.userlevel < 2) {
        console.log(auth);
        res.redirect('/');
    } else {
        res.render('newsadd', {
            title : 'Add News',
            auth : auth,
            uuid : uuidv4()
        })
    }
})

router.get('/edit', (req, res) => {
    if (!req.query.pid) {
        res.redirect('/account');
    } else {
        newsql.getList({pid: req.query.pid})
        .then(resolved => {
            res.render('newsedit', {
                title: 'Edit News',
                auth: auth,
                news: resolved[0]
            })
        }, reason => {
            res.render('404', {
                title: '404 Server Error',
                auth: auth,
                error: reason
            })
        }).catch(err => {
            res.render('500', {
                title: 'Internal Server Error',
                auth: auth,
                error: err
            })
        })
    }
})

router.get('/preview', (req, res) => {
    if (!req.query.pid) {
        res.render('newspreview', {
            news : ''
        })
    } else {
        newsql.getList({pid: req.query.pid})
        .then(resolved => {
            res.render('newspreview', {
                news: resolved[0]
            })
        }, reason => {
            res.render('newspreview', {
                news: ''
            })
        }).catch(err => {
            res.render('newspreview', {
                news: ''
            })
        })
    }
})

//POST requests

router.post('/add', (req, res) => {
    if (!auth.auth || auth.userlevel < 2) {
        res.sendStatus(403);
    } else {
        let form = new frm.IncomingForm();
        form.uploadDir = path.join(__dirname, '../public/images');
        new Promise((reso, reje) => {
            form.parse(req, (err, fields, files) => {
                if (err) {reje(500)}
                else if (files) {
                    let newPath = '/home/aj/Desktop/newnode/public/news/images/' + fields.pid;
                    checkDir(newPath)
                    .then(resolved => {
                        for (let i = 0; i < Object.keys(files).length; i++) {
                            let tag = 'img' + (i + 1);
                            fs.rename(files[tag].path, resolved + '/' + tag + '.jpg', err => {
                                if (err) {throw err};
                            })
                        }
                        var data = {
                            pid : fields.pid,
                            title : fields.title,
                            body : fields.body,
                            owner : auth.user
                        }
                        reso(data);
                    }, reason => {
                        rej(reason);
                    }).catch(err => {
                        console.log(err);
                        rej(err.errno);
                    })
                } else {
                    var data = {
                        pid : fields.pid,
                        title : fields.title,
                        body : fields.body,
                        owner : auth.user,
                        createdOn : new Date()
                    }
                    reso(data);
                }
            })
        }).then(resit => {
            fields = resit;
            fields.pid = auth.user;
            if(req.query.sub == 'true') {
                fields.active = 1;
                fields.createdOn = new Date();
                let path = '/home/aj/Desktop/newnode/public/news/images/' + fields.post_pid;
                childProcess.exec('convert -thumbnail 500 ' + path + '/img1.jpg ' + path + '/thmb.jpg', (err, stdout, stderr) => {
                    if (err) {throw err;}
                })
            };

            newsql.updNews(fields)
            .then(resolved => {
                console.log(resolved);
                if (req.query.sub == 'true') {
                    res.sendStatus(302);
                } else {
                    res.sendStatus(resolved);
                }
            }, reason => {
                res.sendStatus(reason);
            }).catch(err => {res.sendStatus(500)})
        })
        
    }
})

module.exports = router;

//When creating the directories for news images, will mkdir if it does not already exist.
function checkDir (dir) {
    return new Promise ((res, rej) => {
        fs.stat(dir, (err, stats) => {
            if (err && err.errno == -2) {
                console.log(err);
                fs.mkdirSync(dir);
                res(dir);
            } else if (!err) {
                res(dir);
            }else {
                rej(err);
            }
        })
    })
}

var uuidv4 = () => {
    return uuid().slice(0, 7)
}