/**
 * Handle the requests passed to the /posts route
 * This time, keep the logic and the routing seperate from one another
 */

// Core Node Modules


// NPM Modules
import * as express from 'express'
import * as frm from 'formidable'
import * as uuidv4 from 'uuid/v4'

// Local Modules
import { getList, getPost, searchPosts } from '../controllers/posts'

// Types
import { PostCond, Post } from '../../typings/core';

// Global Variables
let postRoutes: express.Router = express.Router()

/**
 * Process GET requests
 */

postRoutes.get('/', (req: express.Request, res: express.Response) => {
    var conditions: PostCond;
    if (req.query.cat) {
        conditions.active = true;
        conditions.post = req.query.cat.split(' ');
    } else if (req.query.pid) {
        conditions.active = true;
        conditions.postPid = req.query.pid;
    } else {
        conditions.active = true;
    }

    getList(conditions)
    .then((results: any) => {
        if (results.length == 1) {
            res.render('indivpost', {
                title : results[0].title,
                post: results[0],
                auth : req.auth
            })
        } else {
            res.render('postlist', {
                title: 'Posts',
                post: results,
                auth : req.auth
            })
        }
    }, reason => {
        console.log(reason);
        res.render('post404', {
            title : 'Not Found',
            auth : req.auth
        })
    }).catch(err => {
        console.log(err);
    })
})

// Create a new post
postRoutes.get('/add', (req: express.Request, res: express.Response) => {
    if (req.auth.auth) {
        res.render('postadd', {
            title: "Add Post",
            errlev : 0,
            uuid : uuidv4().slice(0, 7),
            auth : req.auth
        })
    } else {
        res.redirect('/login/');
    }
})

// Edit an already created and active post
postRoutes.get('/edit/:pid', (req: express.Request, res: express.Response) => {
    if (!req.params.pid) {
        res.redirect('/account/');
    } else if (!req.auth.auth) {
        res.redirect('/login/');
    } else if (req.query.pid) {
        getPost(req.query.pid)
        .then((resolve: Post) => {
            if (resolve.pid == req.auth.pid) {
                res.render('postedit', {
                    title : 'edit post',
                    post : resolve,
                    auth : req.auth
                })
            } else {
                res.redirect('/account/')
            }
        }, reason => {
            res.redirect('/account/?' + reason)
        }).catch (err => {
            res.redirect('/account/?' + err)
        })
    } else {
        res.redirect ('/posts/');
    }
})

/**
 * Process POST requests
 */

// Search Posts
postRoutes.post('/search', (req: express.Request, res: express.Response) => {
    var form: frm.IncomingForm = new frm.IncomingForm()
    new Promise ((reso, reje) => {
        form.parse(req, (err, fields: { conditions: string }) => {
            console.log(fields);
            if (err) {reje(err)}
            else if (!fields) {
                reje(404);
            } else {
                reso(fields);
            }
        })
    })
    .then((resolve: {conditions: string}) => {
        if (resolve.conditions) {
            searchPosts(resolve.conditions).then(resolve => {
                JSON.stringify(resolve)
                console.log('resolve', resolve)
                res.json(resolve)
            }, reason => {
                res.status(reason)
            })
        } else {
            res.status(404)
        }
    }, reason => {
        res.status(reason)
    }).catch(err => {
        res.status(404)
    })
})
// Exports
export { postRoutes }