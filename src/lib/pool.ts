/**
 * Create a mysql pool to export to the controllers
 */

// NPM Modules
import * as mysql from 'mysql'

// Local Modules
import { poolConfig } from './configurations'

// Global Variables
let pool: mysql.Pool

let getPool = (): mysql.Pool => {
    if (pool) {return pool}
    pool = mysql.createPool(poolConfig)
    return pool
}

// Exports
export { getPool }