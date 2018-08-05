//Info for nodemailer email client
exports.transporter = {
    host: 'emailHost',
    port: 'port',
    auth: {
        user: 'username',
        pass: 'password'
    }
}

//MySql db connection
exports.connection = {
    host    : '127.0.0.1',
    user    : 'username',
    password : 'password',
    database : 'tonyslist'
}

exports.secret = "reset and verification token password";

exports.jwt = "checkToken() password";

exports.salt = 'bcrypt salt rounds';
