var mysql = require('mysql');
var fs = require('fs');
var passwd = require('./passwd.js');
var uuidv4 = require('uuid/v4');
var secrets = require('./boxofsecrets.j.js');
var connection = mysql.createConnection(secrets.connection);

exports.getList = () => {
    return new Promise ((res, rej) => {
        console.log('called')
        connection.query('SELECT * FROM news', (err, results, fields) => {
            console.log(results);
            if (err) {
                console.log(err);
            } else {
                res(results);
            }
        })
    })
}