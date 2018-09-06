// NPM Modules
import * as mysql from 'mysql';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';

// Local Modules
import { transporterConfig, jwtSecret } from '../configurations';
import { getPool } from '../pool'

// Types
import { UserData, UserLogin, AuthPayload, AdvancedUserData } from './../../typings/core';
import { Promise } from 'es6-promise';
import { Transporter } from 'nodemailer';

//Global Vars
const saltRounds: number = 12
const pool: mysql.Pool = getPool()

class Register {
    private user: UserData;

    /**
     * First, check that the user does not exist in the db
     * If they do, return 1, if they don't, then create and enter
     * the new user into the users table.
     */
    constructor(newUser: UserData) {
        this.user = newUser;
    }
    
    public create: Function = () => {
        new Promise ((resolve, reject) => {
            new Promise ((resolve, reject) => {
                // Verify that user does not exist
                new Verify(this.user.username, this.user.email).newUser()
                .then(onSuccess => resolve(onSuccess),
                    onFailure => reject(onFailure))
                .catch(err => {throw err})
            })
            .then (onSuccess => {
                new Promise ((resolve, reject) => {
                    // Hash the password, resolve the hash to the query
                    bcrypt.hash(this.user.pass, saltRounds, (err, hash) => {
                        if (err) {throw err}
                        if (!hash) {reject(1)}
                        this.user.pass = hash;
                        resolve()
                    })
                })
                .then (onSuccess => {
                    pool.query(
                        `INSERT INTO users SET ?`,
                        this.user,
                        (err, results, fields) => {
                            if (err) {throw err}
                            console.log(this.user.username, " created at ", Date())
                            // Send verification email
                            new Verify(this.user.username, this.user.email).newEmail();
                        }
                    )
                    resolve(0) // Resolve create property
                }, onFailure => {
                    reject(onFailure)
                })
                .catch (err => {
                    throw err;
                })
            }, failure => {
               reject(failure);
            })
            .catch(err => {
                throw err;
            })
        })
    } // create
}

class Login {
    private user: UserLogin;

    /**
     *  Query database for login, issue token
     */
    constructor(login) {
        this.user = login;        
    }

    public auth = () => {
        /**
         * Status codes:
         * 0 = All Okay
         * 1 = Okay, but display a message
         * 2 = Okay, but redirect
         * 3 = Not okay, display a message
         * 4 = Incorrect Username or password
         * 5 = Internal server error
         */
        return new Promise((resolve, reject) => {
            pool.query(`SELECT pid, email, givenName, famName, userlevel,
            ptoken, emailReset, deletion, active, setup FROM users WHERE 
            username = ?`,
            [this.user.username], 
            (err, results: Array<AdvancedUserData>, fields) => {
                if (err) {throw err}
                if (results == []) {
                    reject({
                        status: 4
                    })
                } else if (results.length == 1) {
                    bcrypt.compare(this.user.pass, results[0].pass, (err, same) => {
                        if (err) {throw err}
                        if (same) checkForErrors(results[0])
                        else reject({
                            status: 4
                        })
                    })
                }
            })
            var checkForErrors = (userResults: AdvancedUserData) => {
                let payload: AuthPayload = {
                    auth: true,
                    userlevel: userResults.userlevel,
                    pid: userResults.pid,
                    expiresIn: '1h'
                }
                let authToken = jwt.sign(payload, jwtSecret)
                if (userResults.ptoken != '') {
                    reject({
                        reason: 'Please check your email for a new password',
                        status: 3
                    })
                } else if (userResults.deletion != '') {
                    resolve({
                        message: 'Your account deletion has been halted',
                        status: 1,
                        cookie: authToken
                    })
                } else if (userResults.emailReset != '') {
                    reject({
                        reason: 'Please verify your email before logging in. Another email verification has been sent.',
                        status: 3
                    })
                } else if (!userResults.setup) {
                    resolve({
                        redirect: '/login/setup',
                        status: 2,
                        cookie: authToken
                    })
                } else {
                    resolve({
                        status: 0,
                        cookie: authToken
                    })
                }
            }
        })
    }
}

class Verify {
    private username: string;
    private email?: string;
    private pass?: string;
    private transporter: Transporter;

    /**
     *  
     */
    constructor(username, email?, pass?) {
        this.username = username;
        this.email = email;
        this.pass = pass;
        this.transporter = nodemailer.createTransport(transporterConfig)
    }

    public newPassword = (): void => {

    }

    public newEmail = (): void => {

    }

    public newUser = () => {
        return new Promise ((resolve, reject) => {
            pool.query(
                `SELECT * FROM users WHERE username = ? OR oldUsername = ? OR email = ?`
                [this.username, this.username, this.email],
                (err, results) => {
                    if (err) throw err;
                    if (results == "") resolve(0)
                     else reject(1);
                }
            )
        })
    }
}

export {
    Register,
    Login,
    Verify
}