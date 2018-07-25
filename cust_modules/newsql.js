var mysql = require('mysql');
var fs = require('fs');
var passwd = require('./passwd.js');
var uuidv4 = require('uuid/v4');
var secrets = require('./boxofsecrets.j.js');
var connection = mysql.createConnection(secrets.connection);

exports.getList = conditions => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM news WHERE ?', conditions, (err, results, fields) => {
            if (err) {rej(err)}
            else if (results == '') {
                rej(404);
            } else {
                res(results);
            }
        })
    })
}

exports.updNews = newNews => {
    return new Promise ((res, rej) => {
        connection.query('SELECT * FROM news WHERE pid = ' + connection.escape(newNews.pid), (err, results, fields) => {
            if (err) {console.log(err);rej(err)}
            else if(results == '') {
                connection.query('INSERT INTO news SET ?', newNews, (err, results, fields) => {
                    if (err) {rej(err)}
                    res(200);
                })
            } else {
                connection.query('UPDATE news SET ? WHERE pid = ' + connection.escape(newNews.pid), newNews, (err, results, fields) => {
                    if (err) {rej(err)}
                    res(200);
                })
            }
        })  
    })
}


