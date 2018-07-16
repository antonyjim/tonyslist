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

/*
    A note on schema

    The main tables are laid out as follows:

    SQL> describe users;
    +-------------+--------------+------+-----+---------+----------------+
    | Field       | Type         | Null | Key | Default | Extra          |
    +-------------+--------------+------+-----+---------+----------------+
    | id          | int(11)      | NO   | PRI | NULL    | auto_increment |
    | username    | varchar(80)  | YES  |     | NULL    |                |
    | pass        | varchar(60)  | YES  |     | NULL    |                |
    | givenname   | varchar(20)  | YES  |     | NULL    |                |
    | famname     | varchar(20)  | YES  |     | NULL    |                |
    | userlevel   | tinyint(4)   | NO   |     | NULL    |                |
    | lastlogin   | datetime     | YES  |     | NULL    |                |
    | pid         | varchar(100) | NO   |     | NULL    |                |
    | ptoken      | varchar(100) | YES  |     | NULL    |                |
    | email_reset | varchar(100) | YES  |     | NULL    |                |
    | deletion    | varchar(100) | YES  |     | NULL    |                |
    | active      | tinyint(1)   | YES  |     | NULL    |                |
    | setup       | tinyint(1)   | YES  |     | NULL    |                |
    +-------------+--------------+------+-----+---------+----------------+

    SQL> describe user_data;
    +----------+--------------+------+-----+---------+----------------+
    | Field    | Type         | Null | Key | Default | Extra          |
    +----------+--------------+------+-----+---------+----------------+
    | id       | int(11)      | NO   | PRI | NULL    | auto_increment |
    | pid      | varchar(100) | NO   |     | NULL    |                |
    | phone    | int(11)      | YES  |     | NULL    |                |
    | settings | varchar(100) | YES  |     | NULL    |                |
    | zip      | int(5)       | YES  |     | NULL    |                |
    +----------+--------------+------+-----+---------+----------------+

    SQL> describe post;
    +-------------+---------------+------+-----+---------+-------+
    | Field       | Type          | Null | Key | Default | Extra |
    +-------------+---------------+------+-----+---------+-------+
    | post_pid    | varchar(100)  | NO   | PRI | NULL    |       |
    | pid         | varchar(100)  | YES  |     | NULL    |       |
    | title       | varchar(100)  | YES  |     | NULL    |       |
    | zip         | int(5)        | YES  |     | NULL    |       |
    | post        | varchar(10)   | YES  |     | NULL    |       |
    | desk        | varchar(1000) | YES  |     | NULL    |       |
    | contact     | int(10)       | YES  |     | NULL    |       |
    | price       | int(6)        | YES  |     | NULL    |       |
    | created_on  | date          | YES  |     | NULL    |       |
    | last_viewed | date          | YES  |     | NULL    |       |
    | active      | tinyint(1)    | YES  |     | NULL    |       |
    | shortdesk   | varchar(30)   | YES  |     | NULL    |       |
    +-------------+---------------+------+-----+---------+-------+

    You may notice some things that don't make a lot of sense, and that's because
    there really is no reason. E.G. in post, the description column is called Desk. 
    Why? Because I made a typo when I created the table and it was easier to change the name 
    of an input than to ALTER post and MODIFY desk. 

    */

//User functions

//Registration Action
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
                        newUser.active = 1;
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

//Initial Sign on Authentication
exports.auth = function(userData) {
    var entry = new Date;
    return new Promise(function (resolve, reject) {
        connection.query('SELECT * FROM users WHERE username = ' + connection.escape(userData.email), function (err, results, fields) {
            if (err) {
                reject(err); 
            } else if (results != '') {
                if (results[0].ptoken != '') {
                    reject(469);
                } else if (results[0].email_reset != '') {
                    reject(470);
                } else if (results[0].active == 1) {
                    var comp = new Promise(function (resolve, reject) {
                        bcrypt.compare(userData.pass, results[0].pass, function (err, res) {
                            if (err) {reject(err)}
                            if (res) {
                                connection.query('UPDATE users SET ? WHERE username = ' + connection.escape(userData.email), 
                                    {lastlogin : entry, deletion : ''}, (err, results, fields) => {
                                    if (err) throw err;
                                })
                                resolve(results[0]);
                            }else {
                                reject(403);
                            }
                        });
                    });

                    comp.then(function (res) {
                        if (res.setup == 1) {
                            var payload = {
                                user: res.pid,
                                userlevel: res.userlevel
                            };
                            var token = jwt.sign(payload, secret, {
                                expiresIn: '1h'
                            });
                            resolve(token);
                        } else {
                            var payload = {
                                user: res.pid,
                                userlevel: res.userlevel
                            };
                            var token = jwt.sign(payload, secret, {
                                expiresIn: '1h'
                            });
                            reject({code : 472, user : results[0].pid})
                        }
                       
                    }, function (rej) {
                        reject(rej);
                    });
                    comp.catch(reason => {
                        console.error(reason);
                    })
                } else if (results[0].active == 0) {
                    reject(471)
                } else {
                    reject(500);
                }
                
            } else {
                reject(404);
            }
        })
    });
    
};

//Check the existence of a username from registration screen
exports.checkExist = function (username) {
    return new Promise(function (resolve, reject) {
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

//Get data from user_data table
exports.userDataGet = pid => {
    return new Promise((res, rej) => {
        connection.query('SELECT phone, zip, pid FROM user_data WHERE pid = ' + connection.escape(pid), (err, results, fields) => {
            if (err) {rej(err)}
            else if (results != '' ) {
                res(results[0]);
            } else {
                rej(473)
            }
        })
    })
}

//Update data in the user_data table
exports.userDataUpd = userData => {
    return new Promise((res, rej) => {
        connection.query('SELECT * FROM user_data WHERE pid = ' + connection.escape(userData.pid), (err, results, fields) => {
            if (err) {rej(err)}
            else if (results != '') {
                var pid = userData.pid;
                delete userData.pid;
                connection.query('UPDATE user_data SET ? WHERE pid = ' + connection.escape(pid), userData, (err, results, fields) => {
                    if (err) {rej(err)}
                    else {
                        connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(pid), {setup : 1}, (err, results, fields) => {
                            if (err) {rej(err)}
                            else {
                                res(200);
                            }
                        })
                    }
                })
            } else if (results == '') {
                connection.query('INSERT INTO user_data SET ?', userData, (err, results, fields) => {
                    if (err) {rej(err)}
                    else {
                        connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(userData.pid), {setup : 1}, (err, results, fields) => {
                            if (err) {rej(err)}
                            else {
                                res(200);
                            }
                        })
                    }
                })
            }
        })
    })
}

//Verify token on incoming auth cookie
exports.checkToken = token => {
    return new Promise ((res, rej) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {rej(err.message)}
            else if (decoded) {
                var payload = {
                    user : decoded.user,
                    userlevel : decoded.userlevel
                };
                var ntoken = jwt.sign(payload, secret, {expiresIn: '1h'});
                var resolved = {
                    auth : true,
                    pid : decoded.user,
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

//Insert password reset token from passwd module
exports.resPass = (email, ptoken) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM users where username = '+ connection.escape(email), (err, results, fields) => {
            if (err) rej(err)
            else if (results == '') {
                rej(404);
            } else {
                connection.query('UPDATE users SET ? WHERE username = ' + connection.escape(email), {ptoken : ptoken}, (err, updates, fields) => {
                    if (err) rej (err);
                    res(results[0]);
                })
            }   
        })
    })
} 

//Verify the email jwt for password reset
exports.verResPass = (ptoken) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM users WHERE ptoken = ' + connection.escape(ptoken), (err, results, fields) => {
            if (err) rej(err);
            if (results == '') {
                console.log('Empty');
                rej(404);
            } else {
                res(results[0]);
            }
        })
    })
}

//Change the password after verifying reset token
exports.forcePass = (pass, pid) => {
    return new Promise ((res, rej) => {
        bcrypt.hash(pass, saltRounds, (err, hash) => {
            if (err) rej(err);
            connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(pid), {pass: hash, ptoken : ''}, (err, results, fields) => {
                if (err) rej(err);
                res(200);
            })
        })
        
    }) 
}

//Enter in the email verification
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

//Update either the password, email or delete the account.
exports.updInfo = (info) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT pid, pass, username, deletion FROM users WHERE pid = ' + connection.escape(info.pid), (err, results, fields) => {
            if (err) {rej(err)}
            else if (results == '') {console.log(info);rej(404)}
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
                            rej(403);
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
                            rej(403);
                        }
                    })
                } else {
                    rej(468);
                }
              
            }
        })
    })
}

//If the user clicks the link in the confirmation email, 
//if the user logs in it will delete the token anyways.
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

//Update post details from account menu
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

//Get an individual post from a req.url in the form of:
// ?pid=randomstring
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

//Get posts for the main /posts screen,
//if there is only 1 result, redirect to individual post screen.
exports.getList = (conditions) => {
    var post = '';
    if (conditions.post) {
        for (let m in conditions.post) {
            post += ' post = ' + connection.escape(conditions.post[m]) + ' OR'
        }
        var cond = post.slice(0, -3);
    } else if (conditions.post_pid) {
        var cond = 'post_pid = ' + connection.escape(conditions.post_pid)
    } else {
        var cond = 'active = 1';
    }
    
    console.log(cond);
    var sql = 'SELECT title, desk, zip, post, post_pid, price FROM post WHERE ' + cond + ' ORDER BY created_on';
    //var old = `'SELECT title, desk, zip, post, post_pid, price FROM post WHERE ? ORDER BY created_on', conditions,`
    return new Promise ((res, rej) => {
        connection.query(sql, (err, results, fields) => {
            if (err) rej(err);
            res(results);
        })
    })
}

//List posts associated with account in the /account menu
exports.getAcctPost = (conditions) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT title, desk, zip, post, post_pid, pid, shortdesk, price FROM post WHERE ?', conditions, (err, results, fields) => {
            if (err) rej(err);
            res(results);
        })
    })
}

//Load the 6 most recent posts for the homepage
exports.getHot = () => {
    return new Promise ((res, rej) => {
        var all = {}
        connection.query('SELECT post_pid, title, zip, price FROM post LIMIT 6', (err, results, fields) => {
            if (err) rej(err);
            connection.query('SELECT DISTINCT post FROM post', (err, categories, fields) => {
                if (err) rej(err);
                all.results = results;
                all.categories = categories;
                res(all);
            })
        })
    })
}