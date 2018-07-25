var express = require('express');
var authenticate = require('./authenticate');
var frm = require('formidable');
var gr = require('./global_resources');

var router = express.Router();

var auth= {
    auth : false,
    user : null,
    cookie : null
};

router.use((req, res, next) => {
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

//Main post listing screen.
router.get('/', (req, res) => {
    var conditions = {};
    if (req.query.cat) {
        conditions.active = true;
        conditions.post = req.query.cat.split(' ');
    } else if (req.query.pid) {
        conditions.active = true;
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

//Create a new post
router.get('/add', (req, res) => {
    if (auth.auth) {
        res.render('postadd', {
            title: "Add Post",
            errlev : 0,
            uuid : auth.user,
            auth : auth
        })
    } else {
        res.redirect('/login/');
    }

    
})

//Edit an already created and active post
router.get('/edit/', (req, res) => {
    if (!req.query.pid) {
        res.redirect('/account/');
    } else if (!auth.auth) {
        res.redirect('/login/');
    } else if (req.query.pid) {
        var f = authenticate.getPost(req.query.pid);

        f.then(resolved => {
            if (resolved.pid == auth.user) {
                res.render('postedit', {
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

//Post request for posts

//Search Posts
router.post('/search', (req, res) => {
    var form = new frm.IncomingForm();
    console.log('Searching...')
    new Promise ((reso, reje) => {
        form.parse(req, (err, fields, files) => {
            console.log(fields);
            if (err) {reje(err)}
            else if (!fields) {
                reje(404);
            } else {
                reso(fields);
            }
        })
    }).then(resolve => {
        if (resolve.conditions) {
            authenticate.searchPosts(resolve.conditions).then(resolved => {
                JSON.stringify(resolved);
                console.log('resolved', resolved);
                res.send(resolved);
            }, reason => {
                console.log(reason);
                res.sendStatus(reason)
            })
        } else {
            res.sendStatus(404)
        }
    }, reason => {
        res.sendStatus(reason);
    }).catch(err => {
        res.sendStatus(404);
    })
})

module.exports = router;