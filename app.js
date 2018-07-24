var express = require('express');
var path = require('path');
var cluster = require('cluster');
/*
if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;
    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on('exit', worker => {
        console.log('Worker exited ', worker.id)
        cluster.fork();
    })
} else {*/
    var app = express();
    var port = '8080';

    //Custom Routing File
    var router = require('./cust_modules/router.js')(app);

    //View Engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    //Set Static Files
    app.use('/public', express.static(path.join(__dirname, 'public')));
    app.use('/json', express.static(path.join(__dirname, 'json')));


    app.listen(port, function() {
        console.log('Server started on port ', port);
    })
//}
