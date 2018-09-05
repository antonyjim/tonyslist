/**
 * Process user actions in this file, such as:
 * - The account page
 * - The login page
 * - The registration page
 */

// Core Modules


// NPM Modules
import * as express from 'express'

// Local Modules
import { Verify } from '../controllers/authentication'

// Types


// Global Vars
let userRoutes: express.Router = express.Router()



export { userRoutes }