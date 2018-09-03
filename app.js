var express = require('express');
var path = require('path');
var cluster = require('cluster');
var app = express();
var port = '8080';
var router = require('./lib/router.js')(app);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/json', express.static(path.join(__dirname, 'json')));
app.listen(port, function () {
    console.log('Server started on port ', port);
});
