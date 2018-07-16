var mysql = require('mysql');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var uuidv4 = require('uuid/v4');
var passwd = require('./passwd.js');
var secrets = require('./boxofsecrets.j.js');
var connection = mysql.createConnection(secrets.connection);

const secret = secrets.jwt;
const saltRounds = secrets.salt;

//User functions

exports.add = (newUser)=>{
    var query = new Promise ((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE username = ' + connection.escape(newUser.email), 
            (err, results, fields) => {
                if (err) {reject(err)} 
                else if (results == "") {
                    var encrypt = new Promise((resolve, reject) => {
                        bcrypt.hash(newUser.pass, saltRounds, (err, hash) => {
                            if (err) reject(err);
                            newUser.pass = hash;
                            resolve(0);
                        });
                    });
                    encrypt.then( value => {
                        var email = passwd.sendVerEmail(newUser.email);
                        newUser.username = newUser.email;
                        newUser.ptoken = '';
                        delete newUser.email;
                        email.then(resolved => {
                            newUser.email_reset = resolved;
                            connection.query('INSERT INTO users SET ?', newUser, (err, results, fields) => {
                                if (err) console.error(err);
                                resolve(0);
                            });
                        }, reason => {
                            reject(reason);
                        }).catch(err => {
                            reject(err);
                        })
                        
                    });
                    
                } else {
                    reject(1);
                }
        });
    });


    
    query.then((value) => {
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
                if (results[0].ptoken != '') {
                    reject(199);
                } else if (results[0].email_reset != '') {
                    reject(198);
                } else {
                    var comp = new Promise(function (resolve, reject) {
                        bcrypt.compare(userData.pass, results[0].pass, function (err, res) {
                            if (err) {reject(err)}
                            if (res) {
                                connection.query('UPDATE users SET ? WHERE username = ' + connection.escape(userData.email), 
                                    {lastlogin : entry, deletion : ''}, (err, results, fields) => {
                                    if (err) throw err;
                                })
                                resolve(results[0]);
                            } else {
                                reject(1);
                            }
                        });
                    });

                    comp.then(function (res) {
                        var payload = {
                            user: results[0].pid,
                            userlevel: results[0].userlevel
                        };
                        var token = jwt.sign(payload, secret, {
                            expiresIn: '1h'
                        });
                        resolve(token);
                    }, function (rej) {
                        reject(rej);
                    });
                    comp.catch(reason => {
                        console.error(reason);
                    })
                }
                
            } else {
                reject(404);
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
                    user : decoded.user,
                    userlevel : decoded.userlevel
                };
                var ntoken = jwt.sign(payload, secret, {expiresIn: '300000'});
                var resolved = {
                    auth : true,
                    user : decoded.user,
                    userlevel : decoded.userlevel,
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
        connection.query('UPDATE users SET ? WHERE username = ' + connection.escape(email), {ptoken : ptoken}, (err, results, fields) => {
            if (err) rej(err);
            connection.query('SELECT username FROM users where username = '+ connection.escape(email), (err, results, fields) => {
                if (err) rej (err);
                res(results[0].username);
            })
        })
    })
} 

exports.verResPass = (ptoken) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM users WHERE ptoken = ' + connection.escape(ptoken), (err, results, fields) => {
            if (err) rej(err);
            if (results == '') {
                rej(404);
            } else {
                connection.query("UPDATE users SET ptoken = '' WHERE pid = " + connection.escape(results[0].pid), (err, results, fields) => {
                    if (err) rej(err);
                    res(results[0]);
                })
            }
        })
    })
}

exports.verEmail = (ptoken, pid) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM users WHERE email_reset = ' + connection.escape(ptoken), (err, results, fields) => {
                if (err) rej(err);
                connection.query("UPDATE users SET email_reset = '' WHERE pid = " + connection.escape(results[0].pid), (err, results, fields) => {
                    if (err) rej(err);
                    res(200)
                })
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

exports.updInfo = (info) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT pid, pass, username, deletion FROM users WHERE pid = ' + connection.escape(info.pid), (err, results, fields) => {
            if (err) {rej(err)}
            else if (!results) {rej(404)}
            else {
                if (info.newPass) {
                    bcrypt.compare(info.oldPass, results[0].pass, (err, compared) => {
                        if (err) rej(403);
                        else if (compared) {
                            bcrypt.hash(info.newPass, saltRounds, (err, hash) => {
                                if (err) rej(err);
                                var hashed = {pass : hash};
                                connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(info.pid), hashed, (err, results, fields) => {
                                    if (err) {rej(err)}
                                    else {res(200)}
                                })
                            })
                        } else {
                            rej(500);
                        }
                    })
                   
                } else if (info.username) {
                    bcrypt.compare(info.pass, results[0].pass, (err, compared) => {
                        if (err) rej(403);
                        else if (compared) {
                            connection.query('SELECT * FROM users WHERE username = ' + connection.escape(info.username), (err, results, fields) => {
                                if (err) {rej(err)}
                                else if (results != '') {
                                    if (results[0].pid == info.pid) {
                                        rej(466)
                                    } else {
                                        rej(465)
                                    }
                                }
                                else if (results == '') {
                                    var updateInfo = {username : info.username};
                                    connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(info.pid), updateInfo, (err, results, fields) => {
                                        if (err) {rej(err)}
                                        else {res(200)}
                                    })
                                } else {
                                    rej(500);
                                }
                            })
                            
                        }else {
                            rej(500);
                        }
                    })
                }  else if (info.email) {
                    bcrypt.compare(info.pass, results[0].pass, (err, compared) => {
                        if (err) rej(403);
                        else if (compared) {
                            var token = new Date();
                            connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(info.pid), {deletion : token}, (err, results, fields) => {
                                if (err) {rej(err)};
                                passwd.delete(info, token).then(resolved => {
                                    res(resolved);
                                }, reason => {
                                    rej(reason);
                                })
                            })
                                                 
                        } else {
                            rej(500);
                        }
                    })
                } else {
                    rej(468);
                }
              
            }
        })
    })
}

exports.cancelDelete = token => {
    return new Promise((res, rej) => {
        passwd.cancelDelete(token).then(resolved => {
            connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(resolved.pid), 
                {deletion : ''}, (err, results, fields) => {
                    if (err) rej(err);
                    var status = {
                        code : 200,
                        message : 'Your account deletion has been successfully cancelled. Redirecting home'
                    }
                    res(status)
                })
        }, reason => {
            rej(reason);
        }).catch(err => {
            rej(err);
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
                    rejj(0);
                } else {
                    var seen = {last_viewed : new Date()}
                    connection.query('UPDATE post SET ? WHERE post_pid = ' + connection.escape(results[0].post_pid), seen, (err, results, fields) => {
                        if (err) console.log(err);
                        console.log(results);
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
                res(resss[0]);
            })
        }, rejj => {
            res(rejj)
        })
    });

    function checkDir (dir) {
        return new Promise ((res, rej) => {
            fs.stat(dir, (err, stats) => {
                if (err && err.errno == -2) {
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
        connection.query('SELECT title, desk, zip, post, post_pid, shortdesk, price FROM post WHERE ? ORDER BY created_on', conditions, (err, results, fields) => {
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