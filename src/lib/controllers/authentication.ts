// NPM Modules
import * as mysql from 'mysql';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';

// Local Modules
import { poolConfig, transporterConfig } from '../configurations';

// Types
import { UserData, UserLogin, AuthPayload } from './../../typings/core';
import { Promise } from 'es6-promise';
import { Transporter } from 'nodemailer';

//Global Vars
const pool: mysql.Pool = mysql.createPool(poolConfig);
const saltRounds: number = 12;

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
     *
     */
    constructor(login) {
        this.user = login;        
    }

    auth = () => {

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