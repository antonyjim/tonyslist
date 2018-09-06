/**
 * Handle the requests passed to the /news route
 * This time, keep the logic and the routing seperate from one another
 */

// Core Node Modules


// NPM Modules
import * as express from 'express'
import * as frm from 'formidable'
import * as uuidv4 from 'uuid/v4'

// Local Modules
// import {  } from '../controllers/news'

// Types
// import { PostCond, Post } from '../../typings/core';

// Global Variables
let newsRoutes: express.Router = express.Router()

export { newsRoutes }