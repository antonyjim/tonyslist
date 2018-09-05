/**
 * Handle / and middleware
 * direct all other requests to appropriate routers
 * 
 * My snippet in express router types: 
 * auth: AuthPayload;
 */

// Core Modules


// NPM Modules
import * as express from 'express'
import * as cookieParser from 'cookie-parser'
import * as jwt from 'jsonwebtoken'

// Local Modules
import { jwtSecret } from './../configurations'
import { postRoutes } from './posts'
import { newsRoutes } from './news';
import { userRoutes } from './users';

// Types
import { AuthPayload } from '../../typings/core';

// Global Vars
const router: express.Router = express.Router();

// Middleware
router.use(cookieParser())
router.use((req: express.Request, res, next) => {
    if (req.cookies.auth) {
        new Promise((resolve, reject) => {
            jwt.verify(
                req.cookies.auth,
                jwtSecret, 
                (err: jwt.JsonWebTokenError, decoded: AuthPayload) => {
                    if (err) reject(err)
                    if (decoded) {
                        let ntoken = jwt.sign(decoded, jwtSecret, {expiresIn: '1h'})
                        req.auth = decoded
                        resolve(ntoken)
                    } else {
                        req.auth = {
                            auth: false,
                            userlevel: 0,
                            pid: 'anon'
                        }
                        let ntoken = jwt.sign(req.auth, jwtSecret, {expiresIn: '1h'})
                        reject(ntoken)
                    }
            })
        })
        .then ((onSuccess: string) => {
            res.set('auth', onSuccess)
            next()
        }, (onFailure: string) => {
            res.set('auth', onFailure)
            next()
        })
        .catch(err => {
            req.auth = {
                auth: false,
                userlevel: 0,
                pid: 'anon'
            }
            let ntoken = jwt.sign(req.auth, jwtSecret, {expiresIn: '1h'})
            res.cookie('auth', ntoken)
            next()
        })
    }
})

// Direct all requests to the correct router
router.use('/posts', postRoutes)
router.use('/news', newsRoutes)
router.use('/users', userRoutes)

export { router }