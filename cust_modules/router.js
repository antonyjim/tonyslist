var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var authenticate = require('./authenticate.js');
var passwd = require('./passwd.js');
var uuidv4 = require('uuid/v4');
var frm = require('formidable');
var morgan = require('morgan');
var childProcess = require('child_process');
var auth= {
    auth : false,
    user : null,
    cookie : null
},
path = require('path'),
password = 0;
var token;

module.exports = (app) => {



    //Middleware
    //app.use(morgan(':url'));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use((req, res, next) => {
        if (req.cookies.auth) {
            var authedd = authenticate.checkToken(req.cookies.auth);
            
            authedd.then (resolve => {
                auth.auth = resolve.auth;
                auth.user = resolve.user;
                res.cookie('auth', resolve.cookie);
                next();
            }, reason => {
                auth.auth = false;
                res.cookie('auth', null);
                next();
            }).catch(err => {
                console.log('Authedd.catch', err);
            })
        } else {
            console.log('No token provided');
            auth.auth = false;
            next();
        }
    });
    app.use((req, res, next) => {
        next();
    })




    //GET Requests
    app.get('/', (req, res) => {
        var getHot = authenticate.getHot();

        getHot.then(resolved => {
            res.render('index', {
                title : 'tonyslist',
                post: resolved,
                auth: auth
            })
        }, reason => {
            console.log(reason);
            res.render('backup', {
                title: '500 Server error',
                auth: auth
            })
        })

    });
    
    app.get('/addna', (req, res) => {
        res.render('addna', {
            title: 'Add National Account',
            auth : auth
        });
    });

    app.get('/users/register', (req, res) => {
        res.render('users', {
            title: 'User Info',
            errlev: 0,
            auth : auth
        });
    });

    app.get('/add/addpost', (req, res) => {
        res.render('addpost', {
            title: "Add Post",
            errlev : 0,
            auth : auth
        })
    })

    app.get('/login', (req, res) => {
        res.render('login', {
            title: "Login", 
            passwordErr: undefined,
            errlev: 0,
            auth : auth
        })
    })

    app.get('/users/forgot', (req, res) => {
        if (req.query.ptoken) {
            var verPt = passwd.verToken(req.query.ptoken);
            console.log(req.query);
            verPt.then(resolved => {
                if (resolved.pid) {
                    res.render('resetpass', {
                        title : 'Reset Password',
                        pid : resolved.pid,
                        jwt : req.query.ptoken,
                        auth : auth
                    })
                }
            }, reason => {
                console.log(reason);
                res.redirect('/');
            }).catch(err => {
                console.log(err);
            })
        } else if (!auth.auth) {
            res.render('forgotpass', {
                title : 'Forgot Password',
                auth : auth
            })
        } else if (auth.auth) {
            res.redirect('/account/update');
        }
    })

    app.get('/logout', (req, res) => {
        res.cookie('auth', null);
        res.redirect(302, '/');
    })

    app.get('/account', (req, res) => {
        var f = authenticate.getAcctPost({pid : auth.user});
        f.then (resolved => {
                res.render('account', {
                    title : 'Account',
                    post : resolved,
                    auth : auth
                }
                )}, rejected => {
                res.render('account', {
                    title : 'No posts found',
                    post : {title : 'No posts found'},
                    auth : auth
                }) 
            }).catch (err => {
                console.log(err)
            })
    })

    app.get('/sell', (req, res) => {
        if (!auth.auth) {
            res.redirect(401, '/login');
        } else {
            res.render('addpost', {
                title : 'New Post',
                uuid : uuidv4(),
                auth : auth
            })
        }
    })

    app.get('/preview', (req, res) => {
        var pid = req.query.pid;
        console.log(req.body.query);

        if (pid) {
            var data = authenticate.getPost(pid);

            data.then(resolve => {
                console.log(resolve[0]);
                res.render('preview', {
                    post : resolve
                })
            }, reason => {
                res.render('preview', {});
                console.log(reason);
            }).catch(err => {
                console.log(err);
            })
        } else {
            res.render('preview');
        }
    })
       
    app.get('/posts', (req, res) => {
        var conditions = {};
        if (req.query.cat) {
            conditions.post = req.query.cat;

        } else if (req.query.pid) {
            conditions.post_pid = req.query.pid;
        } else {
            conditions.active = true;
        }

        var getting = authenticate.getList(conditions);

        getting.then(results => {
            if (results.length == 1) {
                var getPost = authenticate.getPost(results[0].post_pid);
                getPost.then (resolved => {
                    res.render('indivpost', {
                        title : resolved.title,
                        post: resolved,
                        auth : auth
                    })
                }, rejected => {
                    res.render('post500', {
                        error: 'An unknown error occured, please try again later',
                        auth : auth
                    })
                }).catch(err => {
                    console.log(err);
                })
                
            } else {
                res.render('postlist', {
                    title: 'Posts',
                    post: results,
                    auth : auth
                })
            }
        }, reason => {
            res.render('post404', {
                title : 'Not Found',
                auth : auth
            })
        }).catch(err => {
            console.log(err);
        })
    })

    //Post Requests
    app.post('/users/register', (req, res) => {  
        var newUser = {
            givenname: req.body.givenname,
            famname: req.body.famname,
            email: req.body.email,
            pass: req.body.passwd,
            username: req.body.email,
            userlevel: 1,
            pid: uuidv4()
        }


        var pro = new Promise ((resolve, reject) => {
            var add = authenticate.add(newUser);
            resolve(add);
        });

        pro.then((value) => {
                if (value == 0) {
                    res.render('addsucc', {
                        title: 'Success',
                        password: password,
                        auth : auth
                    })
                } else {
                    res.render('login', {
                        title: 'Error',
                        passwordErr: password,
                        errlev: 1,
                        auth : auth
                    })
                }
        }, (reason) => {
            console.log('failure is an option ', reason);
        }).catch(err => {
            console.log(err);
        });
    });

    app.post('/login', (req, res) => {
        if (auth.auth == true) {
            console.log('Already logged in');
            res.redirect(302, '/');
        } else {
            var userData = {
                email: req.body.email,
                pass: req.body.password,
                userId: null
            }
    
            var init = authenticate.auth(userData);
            
            init.then((results) => {
                    res.cookie('auth', results);
                    console.log(req.cookies);
                    res.redirect(302, '/');
                } , reason => {
                    console.log(reason);
                    res.render ('login', {
                        title: "Error",
                        passwordErr: 1,
                        auth: auth
                    });
                });

            
        }});

    app.post('/users/forgot', (req, res) => {
        var email = req.body.username;
        passwd.reset(email);
        res.redirect('/');
    })

    app.post('/users/forgot/change', (req, res) => {
        var verPt = passwd.verToken(req.body.jwt);

        verPt.then(resolved => {
            var f = authenticate.forcePass(req.body.pass, req.body.pid);

            f.then(resolved1 => {
                console.log(resolved1);
                res.redirect('/login');
            }, reason1 => {
                console.log(reason1);
                res.redirect('/users/forgot');
            }).catch(err => console.error(err));
        }, reason => {
            console.log('reasoning is ', reason.message)
            res.redirect('/users/forgot');
        }).catch(err => {console.error(err)});
    })

    app.post('/addImage', (req, res) => {
        var form = new frm.IncomingForm();
        form.uploadDir = path.join(__dirname, '../public/images');
        var parse = new Promise ((reso, reje) => {
            form.parse(req, (err, fields, files) => {
                if (err) {reje(err)} else if (files) {
                var newPath = '/home/aj/Desktop/newnode/public/images/' + fields.post_pid;
                var checking = checkDir(newPath);

                checking.then(res => {

                    for (let i = 0; i < Object.keys(files).length; i++) {
                        var tag = 'img' + (i + 1);
                        fs.rename(files[tag].path, res + '/' + tag + '.jpg', (err) => {
                            if (err) {throw err; reje(23)};
                        })
                    }
                    reso(fields);
                }, rej => {
                    console.error(rej);
                    reje(rej);
                }) 
                checking.catch((err) => {
                    console.log('Catch ', err);
                })
                } else {
                    console.log('No files found');
                    reso(fields);
                }
                
            });

        });

        parse.then(resit => {
            fields = resit;
            fields.pid = auth.user;
            createDesk = fields.desk.split(' ');
            if (createDesk.length > 15) {
                createDesk.slice(-15);
            }
            if (req.query.sub == 'true') {
                fields.active = 1;
                fields.created_on = new Date();
                fields.shortdesk = createDesk.join(' ');
                var path = '/home/aj/Desktop/newnode/public/images/' + fields.post_pid;
                childProcess.exec('convert -thumbnail 250 ' + path + '/img1.jpg ' + path + '/thmb.jpg', (err, stdout, stderr) => {
                    if(err) throw err;
                })
            };
            var update = authenticate.updatePost(fields);
        
                update.then (pu => {
                    console.log('pu', pu)
                    if (req.query.sub == 'true') {
                        res.redirect(200, '/posts/?pid=' + pu);
                    } else {
                        console.log(req.query);
                    }

                    console.log('Success');
                }, rej => {
                   console.error(rej);
                })
                update.catch(err => {
                    console.error(err);
                })
        }, rej => {
            console.log('Error: ', rej);
        }).catch(err => {
            console.log(err);
        })

    })
};

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