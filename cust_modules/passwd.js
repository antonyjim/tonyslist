var authenticate = require('./authenticate.js');
var nodemailer = require('nodemailer');
var uuidv4 = require('uuid/v4');
var jwt = require('jsonwebtoken');

var secret = 'vtaesmnsnk5vdlw2';

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'vtaesmnsnk5vdlw2@ethereal.email',
        pass: 'DUzSm2EmbgMpDWz3BD'
    }
});

exports.reset = email => {
    var ptoken = uuidv4();
    var reset = authenticate.resPass(email, ptoken);

    reset.then (resolved => {
        var payload = ptoken;
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
