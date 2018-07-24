"use strict";
exports.__esModule = true;
var express = require("express");
var authenticate = require("./authenticate");
var newsql = require("./newsql");
var uuidv4 = require('uuid/v4');
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

router.get('/', (req, res) => {
    newsql.getList().then(resolved => {
            res.render('news', {
                title : 'News',
                auth : auth,
                news : resolved
        }, reason => {
            console.log('Reason', reason)
            res.render('500', {
                title : '500 Server Error',
                auth : auth,
                error : reason
            })
        })
    }).catch(err => {
        console.log(err)
        res.render('500', {
            title : '500 Server Error',
            auth : auth,
            error : err
        })
    })
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

module.exports = router;