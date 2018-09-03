import * as fs from 'fs';
import * as mysql from 'mysql';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

// Local Modules
var passwd = require('./passwd.js');
var secrets = require('./boxofsecrets.j.js');

// Types
import { Promise } from 'es6-promise';
import { AuthPayload } from './../typings/core'

//Global vars
let connection = mysql.createConnection(secrets.connection);
const secret = secrets.jwt;
const saltRounds = secrets.salt;

//User functions

//Registration Action
let add = (newUser)=>{
    var query = new Promise ((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE username = ' + connection.escape(newUser.username), 
            (err, results, fields) => {
                if (err) {reject(err)} 
                else if (results == "") {
                    new Promise((resolve, reject) => {
                        bcrypt.hash(newUser.pass, saltRounds, (err, hash) => {
                            if (err) reject(err);
                            newUser.pass = hash;
                            resolve(0);
                        });
                    }).then( value => {
                        var email = passwd.sendVerEmail(newUser);
                        newUser.active = 1;
                        newUser.ptoken = '';
                        email.then(resolved => {
                            newUser.emailReset = resolved;
                            connection.query('INSERT INTO users SET ?', newUser, (err, results, fields) => {
                                if (err) console.error(err);
                                resolve(200);
                            });
                        }, reason => {
                            console.log(reason);
                            reject(500);
                        }).catch(err => {
                            reject(err);
                        })
                        
                    });
                    
                } else {
                    reject(465);
                }
        });
    });
    query.then((value) => {
        return value;
    },(reason) => {
        console.error(reason);
        return 599;
    }).catch((err) => {
        throw err;
    });
    return query;

};

//Initial Sign on Authentication
let authenticate = function(userData) {
    var entry = new Date;
    return new Promise(function (resolve, reject) {
        var un = connection.escape(userData.email);
        connection.query(
            'SELECT pid, username, pass, email, newEmail, givenName, famName, userlevel, ptoken, emailReset, deletion, active, setup FROM users WHERE username = ' + un +' OR newEmail = ' + un, 
            function (err, results: any, fields) {
            if (err) {
                reject(err); 
            } else if (results != '') {
                if (results[0].ptoken != '') {
                    reject(469);
                } else if (results[0].active == 1) {
                    new Promise(function (resolve, reject) {
                        var loginMsg = '';
                        if (results[0].newEmail != ' ' && userData.email != results[0].newEmail) {
                            connection.query(
                                'UPDATE users SET ? WHERE username = ' + connection.escape(userData.email), 
                                {newEmail : '', emailReset : ''}, 
                                (err, results, fields) => {
                                    if (err) {reject(err)};
                                    loginMsg = 'Your email has been reverted to what it used to be because you did not verify your new email.';
                            })
                        } else {
                            reject(470);
                        }
                        bcrypt.compare(userData.pass, results[0].pass, function (err, res) {
                            if (err) {reject(err)}
                            if (res) {
                                connection.query('UPDATE users SET ? WHERE username = ' + connection.escape(userData.email), 
                                    {lastLogin : entry, deletion : ''}, (err, results, fields) => {
                                    if (err) throw err;
                                })
                                results[0].loginMsg = loginMsg;
                                resolve(results[0]);
                            }else {
                                reject(403);
                            }
                        });
                    }).then(function (resolved: any) {
                        if (resolved.setup == 1) {
                            var payload = {
                                user: resolved.pid,
                                userlevel: resolved.userlevel
                            };
                            var token = jwt.sign(payload, secret, {
                                expiresIn: '1h'
                            });
                            resolve(token);
                        } else {
                            var payload = {
                                user: resolved.pid,
                                userlevel: resolved.userlevel
                            };
                            var token = jwt.sign(payload, secret, {
                                expiresIn: '1h'
                            });
                            reject({code : 472, user : results[0].pid, jwt: token})
                        }
                       
                    }, function (rej) {
                        reject(rej);
                    }).catch(reason => {
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
let checkExist = function (username) {
    return new Promise(function (resolve, reject) {
        connection.query('SELECT username, old_username FROM users WHERE username = ' + connection.escape(username), function (err, results, fields) {
            if (err) {
                throw err;
            } else if (results[0].username == username || results[0].username == username) {
                resolve(0);
            } else {
                reject (1)
            }
        })
    })
}

//Get data from userData table
let userDataGet = pid => {
    return new Promise((res, rej) => {
        connection.query('SELECT phone, zip, pid FROM userData WHERE pid = ' + connection.escape(pid), (err, results, fields) => {
            if (err) {rej(err)}
            else if (results != '' ) {
                res(results[0]);
            } else {
                rej(473)
            }
        })
    })
}

//Update data in the userData table
let userDataUpd = userData => {
    return new Promise((res, rej) => {
        var updateData = {
            pid : userData.pid,
            zip : "",
            phone: ""
        };
        var pid = userData.pid;
        if (userData.zip.match(/[0-9]/) && userData.zip.length == 5) {
            updateData.zip = userData.zip;
        } 
        if (userData.phone != '') {
            //var tel = Array.from(userData.phone);
            let tel = userData.phone.split('');
            for (let m in tel) {
                if (isNaN(tel[m])) {
                    tel.splice(tel[m], 1);
                }
            }
            if (tel.length < 12) {
                updateData.phone
            }
        }
        connection.query('SELECT * FROM userData WHERE pid = ' + connection.escape(pid), (err, results, fields) => {
            if (err) {rej(err)}
            else if (results != '') {
                connection.query('UPDATE userData SET ? WHERE pid = ' + connection.escape(pid), updateData, (err, results, fields) => {
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
                connection.query('INSERT INTO userData SET ?', updateData, (err, results, fields) => {
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
            }
        })
    })
}

//Verify token on incoming auth cookie
let checkToken = token => {
    return new Promise ((res, rej) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {rej(err.message)}
            else if (decoded) {
                var payload = {
                    user : decoded.user,
                    userlevel : decoded.userlevel,
                    contact : decoded.contact,
                    zip : decoded.zip
                };
                var ntoken = jwt.sign(payload, secret, {expiresIn: '1h'});
                var resolved: AuthPayload = {
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

//Change the password after verifying reset token
let forcePass = (pass, pid) => {
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
let verEmail = (ptoken, pid) => {
    return new Promise ((res, rej) => {
        connection.query('SELECT pid, username FROM users WHERE emailReset = ' + connection.escape(ptoken), (err, results, fields) => {
                if (err) rej(err);
                var update = {
                    emailReset : '',
                    newEmail : '',
                    email : results[0].newEmail
                }
                connection.query("UPDATE users SET ? WHERE pid = " + connection.escape(results[0].pid), update, (err, results, fields) => {
                    if (err) rej(err);
                    res(200)
                })
            })
    })
}

//Update either the password, email or delete the account.
let updInfo = (info) => {
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
                            connection.query('SELECT pid FROM users WHERE username = ' + connection.escape(info.username), (err, results, fields) => {
                                if (err) {rej(err)}
                                else if (results != '') {
                                    if (results[0].pid == info.pid) {
                                        rej(466)
                                    } else {
                                        rej(465)
                                    }
                                }
                                else if (results == '') {
                                    passwd.sendVerEmail(info).then(resolved => {
                                        var updateInfo = {
                                            newEmail : info.username
                                        };
                                        connection.query('UPDATE users SET ? WHERE pid = ' + connection.escape(info.pid), updateInfo, (err, results, fields) => {
                                            if (err) {rej(err)}
                                            else {res(200)}
                                        })
                                    }, reason => {
                                        rej(reason)
                                    }).catch(err => {rej(err.code)})
                                    
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
let cancelDelete = token => {
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
let updatePost = data => {
    console.log(data);
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM post WHERE postPid = ' + connection.escape(data.postPid), (err, results, fields) => {
            if (err) {throw err};
            if (results != '') {
                var pid = data.postPid;
                connection.query('UPDATE post SET ? WHERE postPid = ' + connection.escape(pid), data, (err, results, fields) => {
                    if (err) {rej(err);} 
                    res(data.postPid);
                })
            } else if (results == '') {
                connection.query('INSERT INTO post SET ?', data, (err, results, fields) => {
                    if (err) { rej(err) };
                    res(data.postPid);
                })
            }
        })
    })
}

//Get an individual post from a req.url in the form of:
// ?pid=randomstring
let getPost = postPid => {
    return  new Promise ((res, rej) => {
        new Promise((ress, rejj) => {
            connection.query('SELECT * FROM post WHERE postPid = ' + connection.escape(postPid), (err, results, fields) => {
                if (err) {rej(err)};
                if (results == '') {
                    rejj(0);
                } else {
                    var seen = {lastViewed : new Date()}
                    connection.query('UPDATE post SET ? WHERE postPid = ' + connection.escape(results[0].postPid), seen, (err, results, fields) => {
                        if (err) console.log(err);
                    })
                    ress(results);
                }
            })
        })
       .then (resss => {
            let newPath: fs.PathLike;
            newPath = `/home/aj/Desktop/newnode/public/images/${resss[0].postPid}`;
            checkDir(newPath)
            .then ((resolu: fs.PathLike) => {
                let filed = fs.readdirSync(resolu);
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
let getList = (conditions) => {
    var post = '';
    if (conditions.post) {
        for (let m in conditions.post) {
            post += ' post = ' + connection.escape(conditions.post[m]) + ' OR'
        }
        var cond = post.slice(0, -3);
    } else if (conditions.postPid) {
        var cond = 'postPid = ' + connection.escape(conditions.postPid)
    } else {
        var cond = 'active = 1';
    }

    var sql = 'SELECT * FROM post WHERE ' + cond + ' ORDER BY createdOn';
    //var old = `'SELECT title, desk, zip, post, postPid, price FROM post WHERE ? ORDER BY createdOn', conditions,`
    return new Promise ((res, rej) => {
        connection.query(sql, (err, results, fields) => {
            if (err) rej(err);
            res(results);
        })
    })
}

//List posts associated with account in the /account menu
let getAcctPost = (conditions) => {
    return new Promise ((res, rej) => {
        connection.query(
            'SELECT * FROM post WHERE ? ORDER BY ACTIVE', 
            conditions, (err, results, fields) => {
            if (err) rej(err);
            let posts = [],
                inactPosts = [];
            for (let m in results) {
                if (results[m].active == 1) {
                    posts.push(results[m])
                } else {
                    inactPosts.push(results[m])
                }
            }
            var returns = {
                posts: posts,
                inactPosts : inactPosts,
                news: {}
            }
            connection.query(
                'SELECT * FROM news WHERE ? ORDER BY ACTIVE', 
                conditions, (err, results, fields) => {
                if (err) rej(err);
                returns.news = results;
                res(returns)
            })
        })
    })
}

//Search
let searchPosts = conditions => {
    return new Promise ((res, rej) => {
        var query = connection.escape('%' + conditions + '%');
        connection.query('SELECT title, zip, post, postPid, price FROM post WHERE desc LIKE ' + query, (err, results, fields) => {
            if (err) {rej(err)}
            else if (results == '') {rej(404)}
            else {res(results)}
        })
    })
}

//Load the 6 most recent posts for the homepage
let getHot = () => {
    return new Promise ((res, rej) => {
        var all = {
            results: {},
            categories: {}
        }
        connection.query('SELECT postPid, title, zip, price FROM post LIMIT 6', (err, results, fields) => {
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

export { 
     getHot,
     getAcctPost, 
     getList, 
     getPost, 
     searchPosts, 
     updatePost, 
     cancelDelete, 
     updInfo,
     add,
     authenticate,
     verEmail,
     checkExist,
     userDataGet,
     userDataUpd,
     checkToken,
     forcePass
    }