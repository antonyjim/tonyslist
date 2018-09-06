/**
 * Handle the core functions for retrieving and updating posts
 */

// Core Node Modules
import { readdir, PathLike } from 'fs'

// NPM Modules


// Local Modules
import { getPool } from './../pool'

// Types
import { PostList, PostCond, Post } from './../../typings/core'
import { Promise } from 'es6-promise';

// Global Variables
const pool = getPool()

let getHot = () => {
    return new Promise ((resolve, reject) => {
        pool.query(
            `SELECT postPid, title, zip, price FROM post LIMIT 6`,
            (err, results, fields) => {
                if (err) {throw err}
                if (results == "") {
                    reject()
                } else {
                    resolve(results)
                }
            }
        )
    })
}

let getCategories = () => {
    return new Promise ((resolve, reject) => {
        pool.query(
            `SELECT DISTINCT post FROM post`,
            (err, categories) => {
                if (err) {throw err}
                if (categories == "") {
                    reject()
                } else {
                    resolve(categories)
                }
            }
        )
    })
}

let getList = (conditions: PostCond) => {
    if(conditions.post.length == 1) {
        var cond = `post = ${conditions.post} AND active = 1`
    } else if (conditions.postPid) {
        var cond = `postPid = ${conditions.postPid} AND active = 1`
    } else {
        var cond = `active = 1` // Return all posts that are active
    }
    return new Promise ((resolve, reject) => {
        pool.query(
            `SELECT * FROM post WHERE ${cond} ORDER BY createdOn`,
            (err, results, fields) => {
                if (err) {throw err}
                resolve(results)
            }
        )
    })
}

let getPost = (postPid) => {
    return new Promise ((resolve, reject) => {
        pool.query(
            `SELECT * FROM post WHERE postPid = ?`,
            postPid,
            (err, results: Array<Post>, fields) => {
                if (err) {throw err}
                if (results.length == 0) {
                    reject()
                } else {
                    pool.query(
                        `UPDATE post SET ?`,
                        {lastViewed: Date()},
                        (err, results, fields) => {
                            if (err) {console.error(err)}
                        }
                    )
                    let path: PathLike = `${global.AppRoot}/public/images/${results[0].postPid}/`
                    readdir(path, (err, files) => {
                        if (err) {throw err}
                        results[0].images = files
                        resolve(results[0])
                    })
                }
            }
        )
    })
}

let searchPosts = (conditions) => {
    return new Promise ((resolve, reject) => {

    })
}

// Exports
export { 
    getHot,
    getList, 
    getPost, 
    getCategories,
    searchPosts
}