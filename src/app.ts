// Core Modules
import * as path from 'path'
import * as cluster from 'cluster'

// NPM Modules
import * as express from 'express'

//Local Modules
import { router } from './lib/routes/index'
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
    var app: express.Application = express()
    var port: number = 8080

    //Custom Routing File
    app.use('/', router)

    //View Engine
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, 'views'))

    //Set Static Files
    app.use('/public', express.static(path.join(__dirname, 'public')))
    app.use('/json', express.static(path.join(__dirname, 'json')))


    app.listen(port, function() {
        console.log('Server started on port ', port)
    })
//}
