 // NPM Packages
const nodemailer = require('nodemailer');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');

 // Local Modules
import * as authenticate from "./authenticate";
import { secret, transporter } from "./boxofsecrets.j";

 // Types
import { Promise } from 'es6-promise';



const mailer = nodemailer.createTransport(transporter);

//Send password reset email
exports.reset = email => {
    var ptoken = {
        ptoken : uuidv4()
    }
    
    authenticate.resPass(email, ptoken)
    .then (resolved => {
        var jwtoken = jwt.sign(ptoken, secret, {expiresIn: '1h'});
        var message = {
            from : 'vtaesmnsnk5vdlw2@ethereal.email',
            to : resolved.email,
            subject : 'Password Reset',
            html : '<a style="bold" href="localhost:8080/users/forgot/?ptoken=' + jwtoken + '"> Click Here to Reset Password </a>'
        }
        mailer.sendMail(message, (err) => {
            if (err) throw err;
            console.log('Successfully sent ', message ,' to ', resolved.username);
        })
        return 0;
    }, reason => {
        console.log('Reasoning', reason);
        return 99;
    }).catch(err => console.error(err))
}

//Verify password reset token
exports.verToken = ptoken => {
    return new Promise ((res, rej) => {
        jwt.verify(ptoken, secret, (err, decoded) => {
            if (err) {console.log(err); rej(err)}
            else if (decoded) {
                var f = authenticate.verResPass(decoded.ptoken);

                f.then(resolved => {
                    res(resolved);
                }, reason => {
                    rej(reason);
                }).catch(err => {
                    console.error(err.message);
                }) 
            }
        })
    })
}

//Verify email after creation or updating email.
exports.sendVerEmail = info => {
    return new Promise ((res, rej) => {
        var ptoken = {
            emailReset: uuidv4()
        }

        authenticate.resPass(info.pid, ptoken).then(resolved => {
            var jwtoken = jwt.sign(ptoken, secret, {expiresIn: '60d'});
            var message = {
                from : 'tonyslist.com',
                to : info.email,
                subject : 'verify email',
                html : '<a style="bold" href="localhost:8080/users/verify/?ptoken=' + jwtoken + '"> Click Here to Verify Email </a>'
            }
            mailer.sendMail(message, (err) => {
                if (err) rej(err);
                res(ptoken);
                console.log('Successfully sent ', message ,' to ', info.email);
            })
        }, reason => {
            rej(reason);
        }).catch(err => {rej(err.code)})
       
    })
}

//Verify verification email
exports.verEmail = ptoken => {
    return new Promise ((res, rej) => {
        jwt.verify(ptoken, secret, (err, decoded) => {
            if (err) {console.log(err); rej(err)}
            else if (decoded) {
                var f = authenticate.verEmail(decoded.ptoken);

                f.then(resolved => {
                    res(resolved);
                }, reason => {
                    rej(reason);
                }).catch(err => {
                    console.error(err.message);
                }) 
            }
        })
    })
}

//Send deletion confirmation
exports.delete = (user, token) => {
    return new Promise ((res, rej) => {
        var jwtoken = jwt.sign({
            pid : user.pid,
            deletion : token
        }, secret, {expiresIn: '24h'});
    
        var message = {
            from : 'tonyslist.com',
            to : user.email,
            subject : 'confirm deletion',
            html : `
            We have received a request to delete the account registered to this site. If you did not mean to submit
            this request, then you can login at any time today or 
            <a style="bold" href="localhost:8080/users/deletion/?deletion=` + jwtoken + `">click here to cancel deletion. </a>
            <br> If you did mean to delete your account, then there is nothing you need to do. Your account will be
            deleted at midnight tonight.
            `
        }
    
        mailer.sendMail(message, (err) => {
            if (err) rej(err);
            res(200);
            console.log('Successfully sent ', message ,' to ', user.email);
        })
    })
}

//Cancel the deletion through email
exports.cancelDelete = token => {
    return new Promise ((res, rej) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {rej(err)}
            res(decoded);
        })
    })
}