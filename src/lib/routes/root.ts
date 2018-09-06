// Core Node Modules
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';

// NPM Modules
import * as express from 'express'
import * as uuidv4 from 'uuid/v4'
import * as frm from 'formidable'

// Local Modules
import { Register, Login } from '../controllers/authentication'
import { UserLogin } from '../../typings/core';

// Global Variables
let rootRoutes: express.Router = express.Router()

// Get Requests

rootRoutes.get('/', (req, res) => {
    res.render('index', {
        title: "tonyslist",
        auth: req.auth
    })
})

rootRoutes.get('/login', (req, res) => {
    res.render('login', {
        title: 'login',
        auth: req.auth,
        passwordErr: ''
    })
})

//Post Requests

rootRoutes.post('/login', (req, res) => {
    let form: frm.IncomingForm = new frm.IncomingForm()
    new Promise ((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {throw err}
            if (!fields) {
                reject('empty')
            } else if (fields.username && fields.password) {
                resolve(fields)
            } else {
                console.log(JSON.stringify(fields))
                reject('wrong data')
            }
        })
    }) 
    .then ((onSuccess: UserLogin) => {
        new Login({
            username: onSuccess.username,
            pass: onSuccess.pass
        }).auth()
    .then ((onSuccess: {status: string, cookie: string, message?: string}) => {
        res.json(JSON.stringify(onSuccess))
    }, (onFailure?: {status: string, reason?: string, redirect?: string}) => {
        res.json(JSON.stringify(onFailure))
    })
    .catch(err => {
        console.log(err)
        res.status(500)
    })
})

export { rootRoutes }