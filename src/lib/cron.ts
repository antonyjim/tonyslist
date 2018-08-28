var mysql = require('mysql');
var secrets = require('./boxofsecrets.j.js');

var connection = mysql.createConnection(secrets.connection);
var now = new Date();

// Set up on a cronjob to run at midnight everynight
connection.query('SELECT * FROM users WHERE deletion < ' + connection.escape(now), (err, results, fields) => {
    if (err) {console.log(err)}
    if (results != '') {
        for (let m in results) {
            connection.query('DELETE FROM users WHERE pid = ' + connection.escape(results[m].pid), (err, results, fields) => {
                if (err) console.log(err);
            })
            connection.query('DELETE FROM post WHERE pid = ' + connection.escape(results[m].pid), (err, results, fields) => {
                if (err) console.log(err);
            })
        }
    }
})