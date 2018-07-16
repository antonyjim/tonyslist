var authenticate = require('./authenticate.js');
var nodemailer = require('nodemailer');
var uuidv4 = require('uuid/v4');
var jwt = require('jsonwebtoken');
var secrets = require('./boxofsecrets.j.js');



const secret = secrets.secret;

const transporter = nodemailer.createTransport(secrets.transporter);

exports.reset = email => {
    var ptoken = uuidv4();
    var reset = authenticate.resPass(email, ptoken);

    reset.then (resolved => {
        var jwtoken = jwt.sign({ptoken : ptoken}, secret, {expiresIn: '1h'});
        var message = {
            from : 'vtaesmnsnk5vdlw2@ethereal.email',
            to : resolved,
            subject : 'Password Reset',
            html : '<a style="bold" href="localhost:8080/users/forgot/?ptoken=' + jwtoken + '"> Click Here to Reset Password </a>'
        }
        transporter.sendMail(message, (err) => {
            if (err) throw err;
            console.log('Successfully sent ', message ,' to ', resolved);
        })
        return 0;
    }, reason => {
        console.log(reason);
        return 99;
    }).catch(err => console.error(err))
}

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

exports.sendVerEmail = email => {
    return new Promise ((res, rej) => {
        var ptoken = uuidv4();
        var jwtoken = jwt.sign({ptoken : ptoken}, secret, {expiresIn: '1h'});
        var message = {
            from : 'tonyslist.com',
            to : email,
            subject : 'verify email',
            html : '<a style="bold" href="localhost:8080/users/verify/?ptoken=' + jwtoken + '"> Click Here to Reset Password </a>'
        }
        transporter.sendMail(message, (err) => {
            if (err) rej(err);
            res(ptoken);
            console.log('Successfully sent ', message ,' to ', email);
        })
    })
}

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
    
        transporter.sendMail(message, (err) => {
            if (err) rej(err);
            res(200);
            console.log('Successfully sent ', message ,' to ', email);
        })
    })
}

exports.cancelDelete = token => {
    return new Promise ((res, rej) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {rej(err)}
            res(decoded);
        })
    })
}