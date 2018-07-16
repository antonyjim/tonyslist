var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var authenticate = require('./authenticate');
var gr = require('./global_resources');
var passwd = require('./passwd.js');
var uuidv4 = require('uuid/v4');
var frm = require('formidable');
var childProcess = require('child_process');
var auth= {
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
            var authedd = authenticate.checkToken(req.cookies.auth);
            
            authedd.then (resolve => {
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

    //Registration Screen
    app.get('/users/register', (req, res) => {
        res.render('users', {
            title: 'User Info',
            errlev: 0,
            auth : auth
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
            var verEmail = passwd.verEmail(req.query.ptoken);
    
            verEmail.then(resolved => {
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
            var verPt = passwd.verToken(req.query.ptoken);
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

    //Cancel deletion screen
    app.get('/users/deletion/', (req, res) => {
        if (req.query.deletion) {
            authenticate.cancelDelete(req.query.deletion).then(resolved => {
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
            authenticate.userDataGet(auth.user).then(reso => {
                var oi = JSON.parse(resolved);
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

    //Create a new post
    app.get('/posts/add', (req, res) => {
        if (auth.auth) {
            res.render('addpost', {
                title: "Add Post",
                errlev : 0,
                uuid : auth.user,
                auth : auth
            })
        } else {
            res.redirect('/login/');
        }

        
    })

    //For the iframe on the edit and add screen.
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

    //Edit an already created and active post
    app.get('/posts/edit/', (req, res) => {
        if (!req.query.pid) {
            res.redirect('/account/');
        } else if (!auth.auth) {
            res.redirect('/login/');
        } else if (req.query.pid) {
            var f = authenticate.getPost(req.query.pid);

            f.then(resolved => {
                if (resolved.pid == auth.user) {
                    res.render('edit', {
                        title : 'edit post',
                        post : resolved,
                        auth : auth
                    })
                } else {
                    res.redirect('/account/');
                }
            }, reason => {
                res.redirect('/account/?' + reason);
            }).catch (err => {res.redirect('/account/?' + err)})
        } else {
            redirect ('/posts/');
        }
    })
       
    //Main post listing screen.
    app.get('/posts/', (req, res) => {
        var conditions = {};
        if (req.query.cat) {
            conditions.post = req.query.cat.split(' ');
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

    //Create user in database
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
    
    //Authenticate with db
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
                    res.redirect(302, '/');
                } , reason => {
                    if (reason.code == 472) {
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
            authenticate.userDataUpd(req.body).then(resolved => {
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
        var email = req.body.username;
        passwd.reset(email);
        res.redirect('/');
    })
    
    //Password reset screen
    app.post('/users/forgot/change', (req, res) => {
        var verPt = passwd.verToken(req.body.jwt);
    
        verPt.then(resolved => {
            var f = authenticate.forcePass(req.body.pass, req.body.pid);
            f.then(resolved1 => {
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
        var form = new frm.IncomingForm();

        var parse = new Promise ((reso, reje) => {
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

        parse.then(resolved => {
            console.log(resolved);
            var updateInfo = authenticate.updInfo(resolved);

            updateInfo.then(resolved => {
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

        var form = new frm.IncomingForm();
        form.uploadDir = path.join(__dirname, '../public/images');
        var parse = new Promise ((reso, reje) => {
            form.parse(req, (err, fields, files) => {
                if (err) {reje(err)} else if (files) {
                var newPath = '/home/aj/Desktop/newnode/public/images/' + fields.post_pid;
                var checking = checkDir(newPath);

                checking.then(resolved => {

                    for (let i = 0; i < Object.keys(files).length; i++) {
                        var tag = 'img' + (i + 1);
                        fs.rename(files[tag].path, resolved + '/' + tag + '.jpg', (err) => {
                            if (err) {throw err};
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
            if (req.query.sub == 'true') {
                fields.active = 1;
                fields.created_on = new Date();
                var path = '/home/aj/Desktop/newnode/public/images/' + fields.post_pid;
                childProcess.exec('convert -thumbnail 250 ' + path + '/img1.jpg ' + path + '/thmb.jpg', (err, stdout, stderr) => {
                    if(err) throw err;
                })
            };
            var update = authenticate.updatePost(fields);
        
            update.then (resolved => {
                if (req.query.sub == 'true') {
                    res.redirect(302, '/posts/?pid=' + resolved);
                } else {
                    console.log(req.query);
                }

                console.log('Success');
            }, reason => {
                console.error(reason);
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