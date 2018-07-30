let fs = require('fs');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let authenticate = require('./authenticate');
let gr = require('./global_resources');
let passwd = require('./passwd.js');
let uuidv4 = require('uuid/v4');
let frm = require('formidable');
let childProcess = require('child_process');
let posts = require('./posts');
let news = require('./news');
let auth= {
    auth : false,
    user : null,
    cookie : null
},
path = require('path'),
password = 0;

module.exports = (app) => {

    //Middleware
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    //Authentication Middleware
    app.use((req, res, next) => {
        if (req.cookies.auth) {
            authenticate.checkToken(req.cookies.auth)
            .then (resolve => {
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
    //Posts router file
    app.use('/posts', posts);
    //News router file
    app.use('/news', news);
    /*
        A note on my authentication and lessons learned: 

        My current authentication works by passing a boolean to the auth.auth property,
        and then it passes the auth object to every single template that includes
        partials/header/ejs or partials/headeracct.ejs. This is not the best way to do 
        it. In the future I will most likely resort to using passport or similar authentication
        strategy.
    */

    //GET Requests

    //Fairly straightforward homepage. In the future I will utilize ejs
    //caching so there isn't an sql query everytime the page is called.
    app.get('/', (req, res) => {
        authenticate.getHot()
        .then(resolved => {
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

    //Registration Screen
    app.get('/register', (req, res) => {
        fs.readFile('./public/layouts/register.json', (err, data) => {
            if (err) {
                res.render('500', {
                    title : '500 Server Error',
                    auth: auth,
                    error: err
                })
            } else {
                var form = JSON.parse(data);
                res.render('form', {
                    title: 'register',
                    auth : auth,
                    form: form
                })
            }
        })
    })
    
    //Login screen
    app.get('/login', (req, res) => {
        if (auth.auth) {
            res.redirect('/');
        } else {
            res.render('login', {
                title: "Login", 
                passwordErr: undefined,
                errlev: 0,
                err : req.query,
                auth : auth
            })
        }
    })
    
    //Verify email
    app.get('/users/verify', (req, res) => {
        if (req.query.ptoken) {
            passwd.verEmail(req.query.ptoken)
            .then(resolved => {
                res.redirect('/login?err=' + resolved)
            }, reason => {
                res.redirect('/login?err=' + reason);
            }).catch(err => {res.redirect('/login?err=' + reason)})
        } else {
            res.redirect('/login?err=notoken');
        }
    })
    
    //Request Password Screen
    app.get('/users/forgot', (req, res) => {
        if (req.query.ptoken) {
            passwd.verToken(req.query.ptoken)
            .then(resolved => {
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

    //Cancel deletion screen
    app.get('/users/deletion/', (req, res) => {
        if (req.query.deletion) {
            authenticate.cancelDelete(req.query.deletion)
            .then(resolved => {
                res.render('deletion', {
                    title : 'cancel delete',
                    auth : auth,
                    error : resolved
                })
            }, reason => {
                res.render('deletion', {
                    title : 'An error occured',
                    auth : auth,
                    error : reason
                })
            }).catch(err => {
                res.render('deletion', {
                    title : 'An error occured',
                    auth : auth,
                    error : err
                })
            })
        } else {
            res.redirect('/');
        }
    })
    
    //Logout
    app.get('/logout', (req, res) => {
        res.cookie('auth', null);
        res.redirect(302, '/');
    })

    //Account posts and details
    app.get('/account', (req, res) => {
        if (auth.auth) {
            authenticate.getAcctPost({pid : auth.user})
            .then (resolved => {
                var news = null;
                res.render('account', {
                    title : 'Account',
                    post : resolved.posts,
                    inactPosts : resolved.inactPosts,
                    auth : auth,
                    news : resolved.news
                }
                )}, rejected => {
                res.render('500', {
                    title : '500 Server Error',
                    auth : auth,
                    error : rejected
                }) 
            }).catch (err => {
                console.log(err)
            })
        } else {
            res.redirect('/login/');
        }
    })

    //An unfortunate way around rewriting an xhr function. Dirty, but it works good
    app.get('/public/layouts/otherinfo.json', (req, res) => {
        new Promise((resolve, reject) => {
            fs.readFile('/home/aj/Desktop/newnode/public/layouts/otherinfo.json', (err, data) => {
                if (err) {reject(err)}
                else {
                    resolve(data);
                }
            })
        }).then(resolved => {
            authenticate.userDataGet(auth.user)
            .then(reso => {
                let oi = JSON.parse(resolved);
                oi.inputs[0].otherAct = reso.zip;
                oi.inputs[1].otherAct = reso.phone;
                res.send(JSON.stringify(oi));
            }, reas => {
                console.log(reas);
                res.sendStatus(500);
            }).catch(err => {
                console.log(err);
            })
        } , reason => {
            conosle.log('Sent');
            res.sendStatus(reason.errno);
        }).catch(err => {
            console.log(err);
            res.sendStatus(501);
        })
    })

    

    //For the iframe on the edit and add screen.
    app.get('/preview', (req, res) => {
        let pid = req.query.pid;
        if (pid) {
            authenticate.getPost(pid)
            .then(resolve => {
                console.log(resolve[0]);
                res.render('preview', {
                    post : resolve
                })
            }, reason => {
                res.render('preview', {
                    post : {}
                });
                console.log(reason);
            }).catch(err => {
                console.log(err);
            })
        } else {
            res.render('preview', {
                post : {}
            });
        }
    })

    

    //Post Requests

    //Create user in database
    app.post('/register', (req, res) => {  
        let form = new frm.IncomingForm();

        new Promise ((reso, reje) => {
            form.parse(req, (err, fields, files) => {
                if (err) {reje(err)}
                else if (!fields) {reje(404)}
                else if (fields) {
                    let emailFilter = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    let usernameFilter = /^([a-zA-Z0-9]){8,20}$/;
                    let passwdFilter = /^([a-zA-Z0-9.]){6,20}$/;
                    console.log(fields);
                    if (!fields.email.match(emailFilter)) {
                        reje('email');
                    } else if (!fields.username.match(usernameFilter)){
                        reje('username')
                    } else if (!fields.passwd.match(passwdFilter)){
                        reje('passwd');
                    } else {
                        let newUser = {
                            pid : uuidv4().slice(0, 8),
                            username : fields.username,
                            email : fields.email,
                            pass : fields.passwd,
                            givenName : fields.givenName,
                            famName : fields.famName,
                            userlevel : 1,
                            setup: 0
                        }
                        reso(newUser)
                    }
                } else {
                    reje(500)
                }
            })
        }).then (resolved => {
            authenticate.add(resolved)
            .then(value => {
                res.render('addsucc', {
                    title : 'Successfully Added',
                    auth: auth
                })
            }, reason => {
                res.status(reason.code).send(reason.error);
            }).catch(err => {
                res.send(err);
            })
        }).catch(err => {
            res.send(err);
        })
    });
    
    //Authenticate with db
    app.post('/login', (req, res) => {
        if (auth.auth == true) {
            console.log('Already logged in');
            res.redirect(302, '/');
        } else {
            let userData = {
                email: req.body.email,
                pass: req.body.password,
                userId: null
            }
    
            authenticate.auth(userData)
            .then((results) => {
                    res.cookie('auth', results);
                    res.redirect('/');
                } , reason => {
                    if (reason.code == 472) {
                        res.cookie('auth', reason.jwt)
                        res.render('moreinfo', {
                            title: 'More Info',
                            user: reason.user,
                            auth: auth
                        })
                    } else {
                        res.render ('login', {
                            title: "Error",
                            passwordErr: reason,
                            auth: auth
                        });
                    }
                });
    
            
        }});

    //Process first login form.
    app.post('/users/moreinfo/', (req, res) => {
        if (!req.body.pid) {
            res.redirect('/login/');
        } else {
            authenticate.userDataUpd(req.body)
            .then(resolved => {
                res.redirect('/');
            }, reason => {
                console.log(reason);
                res.render('moreinfo', {
                    title : 'An error occured',
                    auth : auth
                })
            }).catch(err => {
                console.log(err); 
                res.redirect('/login');
            })
        }
    })
    
    //Send out password email
    app.post('/users/forgot', (req, res) => {
        let email = req.body.username;
        passwd.reset(email);
        res.redirect('/');
    })
    
    //Password reset screen
    app.post('/users/forgot/change', (req, res) => {
        passwd.verToken(req.body.jwt)
        .then(resolved => {
            authenticate.forcePass(req.body.pass, req.body.pid)
            .then(resolved1 => {
                res.redirect('/login');
            }, reason1 => {
                res.redirect('/users/forgot');
            }).catch(err => console.error(err));
        }, reason => {
            console.log('reasoning is ', reason.message)
            res.redirect('/users/forgot');
        }).catch(err => {console.error(err)});
    })

    //Update either the email, password or user_data table
    app.post('/account/update/', (req, res) => {
        if (!auth.auth) {
            res.status(403); 
        }
        let form = new frm.IncomingForm();

        new Promise ((reso, reje) => {
            form.parse(req, (err, fields, files) => {
                if (err) {reje(err)}
                else if (!fields) {reje(new gr.Error(467, 'Nothing Here!'))}
                else {
                    if (fields.newPass) {
                        if (fields.newPass != fields.verNewPass) {
                            reje(new gr.Error(466, 'Mismatched Passwords'))
                        } else if (fields.newPass === fields.verNewPass) {
                            delete fields.verNewPass;
                            reso(fields);
                        } else {
                            reje(new gr.Error(463, 'Unknown'))
                        }
                    } else if (fields.username || fields.email) {
                        reso(fields)
                    } else if (fields.zip || fields.phone) {
                        reje({code : 999, fields : fields});
                    } else{
                        reje(new gr.Error(463, 'Not email or password'))
                    }
                }
            })
        })
        .then(resolved => {
            console.log(resolved);
            authenticate.updInfo(resolved)
            .then(resolved => {
                res.status(200).send(resolved);
            }, reason => {
                console.log('Reasoning', reason);
                res.sendStatus(reason);
            }).catch(err => res.status(500).send(err))
        }, reason => {
            if (reason.code == 999) {
                authenticate.userDataUpd(reason.fields).then(resolve => {
                    res.sendStatus(resolve);
                }, reasoning => {
                    res.sendStatus(reasoning)
                }).catch(err => {
                    console.log(err);
                    res.sendStatus(500);
                })
            } else {
                res.sendStatus(500)
                console.log('The reason is ', reason)
            }
        }).catch(err => {
            console.log(err);
        })
    })

    //Put a new or updated post in the db.
    app.post('/addImage', (req, res) => {

        let form = new frm.IncomingForm();
        form.uploadDir = path.join(__dirname, '../public/images');
        new Promise ((reso, reje) => {
            form.parse(req, (err, fields, files) => {
                if (err) {reje(err)} else if (files) {
                let newPath = '/home/aj/Desktop/newnode/public/images/' + fields.postPid;
                checkDir(newPath)
                .then(resolved => {

                    for (let i = 0; i < Object.keys(files).length; i++) {
                        let tag = 'img' + (i + 1);
                        fs.rename(files[tag].path, resolved + '/' + tag + '.jpg', (err) => {
                            if (err) {throw err};
                        })
                    }
                    reso(fields);
                }, rej => {
                    console.error(rej);
                    reje(rej);
                }).catch((err) => {
                    console.log('Catch ', err);
                })
                } else {
                    console.log('No files found');
                    reso(fields);
                }
                
            });

        })
        .then(resit => {
            fields = resit;
            fields.pid = auth.user;
            if (req.query.sub == 'true') {
                fields.created_on = new Date();
                let path = '/home/aj/Desktop/newnode/public/images/' + fields.post_pid;
                console.log('Converting...')
                childProcess.exec('convert -thumbnail 250 ' + path + '/img1.jpg ' + path + '/thmb.jpg', (err, stdout, stderr) => {
                    if(err) throw err;
                })
            };
            authenticate.updatePost(fields)
            .then (resolved => {
                if (req.query.sub == 'true') {
                    res.redirect(302, '/posts/?pid=' + resolved);
                } else {
                    console.log(req.query);
                }

                console.log('Success');
            }, reason => {
                console.error(reason);
            }).catch(err => {
                console.error(err);
            })
        }, rej => {
            console.log('Error: ', rej);
        }).catch(err => {
            console.log(err);
        })

    })
}

//When creating the directories for new post images, will mkdir if it does not already exist.
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