"use strict";
exports.__esModule = true;
var path = require("path");
var express = require("express");
var index_1 = require("./lib/routes/index");
var app = express();
var port = 8080;
app.use('/', index_1.router);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/json', express.static(path.join(__dirname, 'json')));
app.listen(port, function () {
    console.log('Server started on port ', port);
});
