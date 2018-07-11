var mysql = require('mysql');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var secrets = require('./boxofsecrets.j.js');
var connection = mysql.createConnection(secrets.connection);

const secret = secrets.jwt;
const saltRounds = secrets.salt;

//User functions

exports.add = (newUser)=>{
    var query = new Promise ((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE email = ' + connection.escape(newUser.email), 
            (err, results, fields) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else if (results == "") {
                    var encrypt = new Promise((resolve, reject) => {
                        bcrypt.hash(newUser.pass, saltRounds, (err, hash) => {
                        newUser.pass = hash;
                        console.log(hash);
                        resolve(0);
                        });
                    });
                    encrypt.then(function(value) {
                        connection.query('INSERT INTO users SET ?', newUser, (err, results, fields) => {
                            if (err) console.error(err);
                            console.log('Added');
                        });
                    });
                    
                    resolve(0);
                } else {
                    console.log('results' + results);
                    resolve(1);
                }
        });
    });


    
    query.then((value) => {
        console.log(value);
        return value;
    },(reason) => {
        console.error(err);
        return 599;
    });

    query.catch((err) => {
        throw err;
    });
    return query;

};


exports.auth = function(userData) {
    var entry = new Date;
    return new Promise(function (resolve, reject) {
        connection.query('SELECT * FROM users WHERE username = ' + connection.escape(userData.email), function (err, results, fields) {
            if (err) {
                reject(err); 
            } else if (results != '') {
                console.log(results);
                var comp = new Promise(function (resolve, reject) {
                    bcrypt.compare(userData.pass, results[0].pass, function (err, res) {
                        if (err) {reject(err)}
                        if (res) {
                            connection.query('UPDATE users SET ? WHERE username = ' + connection.escape(userData.email), {lastlogin : entry}, (err, results, fields) => {
                                if (err) throw err;
                                console.log('Last login ', entry)
                            })
                            resolve(results[0]);
                        } else {
                            reject(1);
                        }
                    });
                });
                
                comp.then(function (res) {
                    var payload = {
                        user: results[0].pid
                    };
                    var token = jwt.sign(payload, secret, {
                        expiresIn: '30000'
                    });

                    resolve(token);
                }, function (rej) {
                    reject(rej);
                });
                comp.catch(reason => {
                    console.error(reason);
                })
            } else {
                reject('Not found');
            }
        })
    });
    
};

exports.checkExist = function (username) {
    return new Promise(function (reject, resolve) {
        connection.query('SELECT * FROM users WHERE username = ' + connection.escape(username), function (err, results, fields) {
            if (err) {
                throw err;
            } else if (results[0].username == username) {
                console.log('Found it here');
                resolve(0);
            } else {
                reject (1)
            }
        })
    })
}

exports.checkToken = token => {
    return new Promise ((res, rej) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {rej(err.message)}
            else if (decoded) {
                var payload = {
                    user : decoded.user
                };
                var ntoken = jwt.sign(payload, secret, {expiresIn: '300000'});
                var resolved = {
                    auth : true,
                    user : decoded.user,
                    cookie : ntoken
                }
                res(resolved);
            } else {
                rej(403);
            }
        });
    });
}

exports.resPass = (email, ptoken) => {
    return new Promise ((res, rej) => {
        connection.query('UPDATE users SET ? WHERE email = ' + connection.escape(email), {ptoken : ptoken}, (err, results, fields) => {
            if (err) rej(err);
            connection.query('SELECT email FROM users where email = '+ connection.escape(email), (err, results, fields) => {
                if (err) rej (err);
                res(results[0].email);
            })
        })
    })
} 

exports.verResPass = (ptoken) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM users WHERE ptoken = ' + connection.escape(ptoken), (err, results, fields) => {
            if (err) rej(err);
            res(results[0]);
        })
    })
}

exports.forcePass = (pass, pid) => {
    return new Promise ((res, rej) => {
        bcrypt.hash(pass, saltRounds, (err, hash) => {
            if (err) rej(err);
            connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(pid), {pass: hash, ptoken : null}, (err, results, fields) => {
                if (err) rej(err);
                res(results);
            })
        })
        
    }) 
}


//Post functions

exports.updatePost = data => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM post WHERE post_pid = ' + connection.escape(data.post_pid), (err, results, fields) => {
            if (err) {throw err};
            if (results != '') {
                var pid = data.post_pid;
                connection.query('UPDATE post SET ? WHERE post_pid = ' + connection.escape(pid), data, (err, results, fields) => {
                    if (err) {rej(err);} 
                    res(data.post_pid);
                })
            } else if (results == '') {
                connection.query('INSERT INTO post SET ?', data, (err, results, fields) => {
                    if (err) { rej(err) };
                    res(data.post_pid);
                })
            }
        })
    })
}

exports.getPost = (post_pid) => {
    return  new Promise ((res, rej) => {
        var j = new Promise((ress, rejj) => {
            connection.query('SELECT post, post_pid, desk, price, title, pid, contact, zip FROM post WHERE post_pid = ?', post_pid, (err, results, fields) => {
                if (err) {rej(err)};
                if (results == '') {
                    console.log('No results found ', results)
                    rejj(0);
                } else {
                    var seen = {last_viewed : new Date()}
                    connection.query('UPDATE post SET ? WHERE post_pid = ' + connection.escape(results[0].post_pid), seen, (err, results, fields) => {
                        console.log(seen);
                    })
                    ress(results);
                }
            })
        })
       
        j.then (resss => {
            var newPath = '/home/aj/Desktop/newnode/public/images/' + resss[0].post_pid;
            var dir = checkDir(newPath);
            dir.then (resolu => {
                var filed = fs.readdirSync(resolu)
                resss[0].images = filed;
                console.log(resss[0]);
                res(resss[0]);
            })
        }, rejj => {
            console.log('failed', rejj)
            res(rejj)
        })
    });

    function checkDir (dir) {
        return new Promise ((res, rej) => {
            fs.stat(dir, (err, stats) => {
                if (err && err.errno == -2) {
                    console.log(err);
                    fs.mkdir(dir, err => console.log(err));
                    res(dir);
                } else if (!err) {
                    res(dir);
                }else {
                    rej(err);
                }
            })
        })
    }
}

exports.getList = (conditions) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT title, desk, zip, post, post_pid, shortdesk, price FROM post WHERE ?', conditions, (err, results, fields) => {
            if (err) rej(err);
            res(results);
        })
    })
}

exports.getAcctPost = (conditions) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT title, desk, zip, post, post_pid, pid, shortdesk, price FROM post WHERE ?', conditions, (err, results, fields) => {
            if (err) rej(err);
            res(results);
        })
    })
}

exports.getHot = () => {
    return new Promise ((res, rej) => {
        connection.query('SELECT post_pid, title, zip, price FROM post LIMIT 5', (err, results, fields) => {
            if (err) rej(err);
            res(results);
        })
    })
}